import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { enrollmentTable } from "@/lib/server/db/schema/enrollment";
import { memberRecordTable } from "@/lib/server/db/schema/member-record";
import { organizationTable } from "@/lib/server/db/schema/organization";
import { paymentTable } from "@/lib/server/db/schema/payment";
import { programsTable } from "@/lib/server/db/schema/program";
import { createFrisbiiClient, FrisbiiApiError } from "@/lib/server/frisbii/client";
import { badRequest, notFound, unauthorized, zodErrorResponse } from "@/lib/server/http";

const createChargeSessionSchema = z.object({
  enrollmentId: z.number().int().positive(),
  currency: z.string().length(3).optional().default("DKK"),
  acceptPath: z.string().optional().default("/payment/success"),
  cancelPath: z.string().optional().default("/payment/cancel"),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = createChargeSessionSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const { enrollmentId, currency, acceptPath, cancelPath } = parsed.data;

  const rows = await db
    .select({
      enrollment: enrollmentTable,
      program: programsTable,
      organization: organizationTable,
      member: memberRecordTable,
    })
    .from(enrollmentTable)
    .innerJoin(programsTable, eq(enrollmentTable.programId, programsTable.id))
    .innerJoin(organizationTable, eq(programsTable.organizationId, organizationTable.id))
    .innerJoin(memberRecordTable, eq(enrollmentTable.memberId, memberRecordTable.id))
    .where(eq(enrollmentTable.id, enrollmentId))
    .limit(1);

  const row = rows[0];

  if (!row) {
    return notFound("Enrollment not found");
  }

  if (row.member.userId !== session.user.id) {
    return unauthorized();
  }

  if (!row.organization.paymentApiKey) {
    return badRequest("Payment not configured for this organization");
  }

  const paymentHandle = `member-${enrollmentId}-${randomUUID()}`;
  const baseUrl = `https://${row.organization.subdomain}.limaskap.fo`;
  const acceptUrl = `${baseUrl}${acceptPath}?handle=${paymentHandle}`;
  const cancelUrl = `${baseUrl}${cancelPath}?handle=${paymentHandle}`;

  const amount = row.program.price;

  try {
    const frisbiiClient = createFrisbiiClient(row.organization.paymentApiKey);
    const customerHandle = `${row.organization.slug}-member-${row.member.id}`;

    const sessionResponse = await frisbiiClient.createChargeSession({
      order: {
        handle: paymentHandle,
        amount,
        currency,
        customer: {
          handle: customerHandle,
          email: session.user.email,
          first_name: row.member.firstName,
          last_name: row.member.lastName,
        },
        ordertext: `${row.program.name} - ${row.member.firstName} ${row.member.lastName}`,
      },
      settle: true,
      accept_url: acceptUrl,
      cancel_url: cancelUrl,
      locale: "da_DK",
    });

    await db.insert(paymentTable).values({
      handle: paymentHandle,
      organizationId: row.organization.id,
      enrollmentId: row.enrollment.id,
      amount,
      currency,
      status: "PENDING",
      sessionId: sessionResponse.id,
      directSettle: true,
      acceptUrl,
      cancelUrl,
    });

    await db
      .update(enrollmentTable)
      .set({ paymentStatus: "PENDING" })
      .where(eq(enrollmentTable.id, enrollmentId));

    return Response.json({
      sessionId: sessionResponse.id,
      checkoutUrl: sessionResponse.url,
      paymentHandle,
    });
  } catch (error) {
    if (error instanceof FrisbiiApiError) {
      return badRequest(`Payment provider error: ${error.message}`);
    }

    throw error;
  }
}
