import { eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { enrollmentTable } from "@/lib/server/db/schema/enrollment";
import { memberRecordTable } from "@/lib/server/db/schema/member-record";
import { organizationTable } from "@/lib/server/db/schema/organization";
import { paymentTable } from "@/lib/server/db/schema/payment";
import { programsTable } from "@/lib/server/db/schema/program";

export async function getEnrollmentPaymentContext(enrollmentId: number) {
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

  return rows[0] ?? null;
}

export async function createPayment(values: typeof paymentTable.$inferInsert) {
  await db.insert(paymentTable).values(values);
}

export async function setEnrollmentPaymentPending(enrollmentId: number) {
  await db
    .update(enrollmentTable)
    .set({ paymentStatus: "PENDING" })
    .where(eq(enrollmentTable.id, enrollmentId));
}

export async function getPaymentStatusByHandle(handle: string) {
  const rows = await db
    .select({
      payment: paymentTable,
      enrollment: enrollmentTable,
    })
    .from(paymentTable)
    .innerJoin(enrollmentTable, eq(paymentTable.enrollmentId, enrollmentTable.id))
    .where(eq(paymentTable.handle, handle))
    .limit(1);

  return rows[0] ?? null;
}
