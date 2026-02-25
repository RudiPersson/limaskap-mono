import { desc, eq } from "drizzle-orm";

import { auth } from "@/lib/server/auth";
import { oreToKroner } from "@/lib/server/currency";
import { db } from "@/lib/server/db";
import { enrollmentTable } from "@/lib/server/db/schema/enrollment";
import { memberRecordTable } from "@/lib/server/db/schema/member-record";
import { programsTable } from "@/lib/server/db/schema/program";
import { unauthorized } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return unauthorized();
  }

  const enrollments = await db
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
    .where(eq(memberRecordTable.userId, session.user.id))
    .orderBy(desc(enrollmentTable.signedUpAt));

  const result = enrollments.map(row => ({
    enrollmentId: row.enrollmentId,
    memberRecordId: row.memberRecordId,
    programId: row.programId,
    memberRecordName: `${row.memberFirstName} ${row.memberLastName}`,
    programName: row.programName,
    programPrice: oreToKroner(row.programPriceOre),
    enrollmentStatus: row.enrollmentStatus,
    signedUpAt: row.signedUpAt.toISOString(),
    startDate: row.startDate.toISOString().split("T")[0],
    endDate: row.endDate.toISOString().split("T")[0],
  }));

  return Response.json(result);
}
