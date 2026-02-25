import { eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { user } from "@/lib/server/db/schema/auth-schema";
import { enrollmentTable } from "@/lib/server/db/schema/enrollment";
import { memberRecordTable } from "@/lib/server/db/schema/member-record";
import { organizationTable } from "@/lib/server/db/schema/organization";
import { programsTable } from "@/lib/server/db/schema/program";

export async function listEnrollments() {
  return db.query.enrollmentTable.findMany();
}

export async function getEnrollmentById(id: number) {
  return db.query.enrollmentTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });
}

export async function getEnrollmentByInvoiceHandle(invoiceHandle: string) {
  return db.query.enrollmentTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.invoiceHandle, invoiceHandle);
    },
  });
}

export async function getExistingEnrollment(programId: number, memberId: number) {
  return db.query.enrollmentTable.findFirst({
    where(fields, operators) {
      return operators.and(
        operators.eq(fields.programId, programId),
        operators.eq(fields.memberId, memberId),
      );
    },
  });
}

export async function getMemberWithUser(memberId: number) {
  const rows = await db
    .select()
    .from(memberRecordTable)
    .innerJoin(user, eq(memberRecordTable.userId, user.id))
    .where(eq(memberRecordTable.id, memberId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getProgramWithOrganization(programId: number) {
  const rows = await db
    .select()
    .from(programsTable)
    .leftJoin(organizationTable, eq(programsTable.organizationId, organizationTable.id))
    .where(eq(programsTable.id, programId))
    .limit(1);

  return rows[0] ?? null;
}

export async function createEnrollment(values: typeof enrollmentTable.$inferInsert) {
  const [created] = await db.insert(enrollmentTable).values(values).returning();
  return created;
}
