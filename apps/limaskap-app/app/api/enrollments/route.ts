import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { user } from "@/lib/server/db/schema/auth-schema";
import { createEnrollmentSchema, enrollmentTable } from "@/lib/server/db/schema/enrollment";
import { memberRecordTable } from "@/lib/server/db/schema/member-record";
import { organizationTable } from "@/lib/server/db/schema/organization";
import { programsTable } from "@/lib/server/db/schema/program";
import { createHostedCheckout } from "@/lib/server/frisbii/checkout";
import { conflict, notFound, unauthorized, zodErrorResponse } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET() {
  const enrollments = await db.query.enrollmentTable.findMany();
  return Response.json(enrollments);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = createEnrollmentSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const enrollment = parsed.data;

  const existingEnrollment = await db.query.enrollmentTable.findFirst({
    where(fields, operators) {
      return operators.and(
        operators.eq(fields.programId, enrollment.programId),
        operators.eq(fields.memberId, enrollment.memberId),
      );
    },
  });

  if (existingEnrollment) {
    return conflict("Enrollment already exists for this program and member");
  }

  const memberRecord = await db
    .select()
    .from(memberRecordTable)
    .innerJoin(user, eq(memberRecordTable.userId, user.id))
    .where(eq(memberRecordTable.id, enrollment.memberId))
    .limit(1);

  const memberRecordData = memberRecord[0];

  if (!memberRecordData || memberRecordData.member_record.userId !== session.user.id) {
    return unauthorized("Member record does not belong to current user");
  }

  const programWithOrganization = await db
    .select()
    .from(programsTable)
    .leftJoin(organizationTable, eq(programsTable.organizationId, organizationTable.id))
    .where(eq(programsTable.id, enrollment.programId))
    .limit(1);

  const programData = programWithOrganization[0];

  if (!programData || !programData.organization) {
    return notFound("Program not found");
  }

  if (!programData.organization.paymentApiKey) {
    return notFound("Payment API key not found");
  }

  const paymentHandle = `program-${enrollment.programId}-${randomUUID()}`;
  const baseUrl = `https://${programData.organization.subdomain}.limaskap.fo`;
  const successUrl = `${baseUrl}/payment/success?handle=${paymentHandle}`;
  const cancelUrl = `${baseUrl}/payment/cancel?handle=${paymentHandle}`;

  const checkout = await createHostedCheckout({
    amount: programData.program.price,
    currency: "DKK",
    successUrl,
    cancelUrl,
    handle: paymentHandle,
    apiKey: programData.organization.paymentApiKey,
    ordertext: `${programData.program.name} - ${memberRecordData.member_record.firstName} ${memberRecordData.member_record.lastName}`,
    customer: {
      handle: memberRecordData.user.email,
      email: memberRecordData.user.email,
      first_name: memberRecordData.user.name,
    },
  });

  await db
    .insert(enrollmentTable)
    .values({
      ...enrollment,
      invoiceHandle: paymentHandle,
    })
    .returning();

  return Response.json(checkout, { status: 201 });
}
