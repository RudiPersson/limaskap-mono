import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { enrollmentTable } from "@/lib/server/db/schema/enrollment";
import { memberRecordTable } from "@/lib/server/db/schema/member-record";
import { programsTable } from "@/lib/server/db/schema/program";

export async function listMembersByUserId(userId: string) {
  return db.query.memberRecordTable.findMany({
    where(fields, operators) {
      return operators.eq(fields.userId, userId);
    },
  });
}

export async function createMember(values: typeof memberRecordTable.$inferInsert) {
  const [created] = await db.insert(memberRecordTable).values(values).returning();
  return created;
}

export async function updateMember(
  userId: string,
  memberId: number,
  values: Partial<typeof memberRecordTable.$inferInsert>,
) {
  const [updated] = await db
    .update(memberRecordTable)
    .set(values)
    .where(and(eq(memberRecordTable.id, memberId), eq(memberRecordTable.userId, userId)))
    .returning();

  return updated;
}

export async function listUserEnrollments(userId: string) {
  return db
    .select({
      enrollmentId: enrollmentTable.id,
      memberRecordId: memberRecordTable.id,
      programId: programsTable.id,
      memberFirstName: memberRecordTable.firstName,
      memberLastName: memberRecordTable.lastName,
      programName: programsTable.name,
      programPriceOre: programsTable.price,
      enrollmentStatus: enrollmentTable.status,
      signedUpAt: enrollmentTable.signedUpAt,
      startDate: programsTable.startDate,
      endDate: programsTable.endDate,
    })
    .from(enrollmentTable)
    .innerJoin(memberRecordTable, eq(enrollmentTable.memberId, memberRecordTable.id))
    .innerJoin(programsTable, eq(enrollmentTable.programId, programsTable.id))
    .where(eq(memberRecordTable.userId, userId))
    .orderBy(desc(enrollmentTable.signedUpAt));
}
