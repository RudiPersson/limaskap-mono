import { and, desc, eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "../../lib/types.js";
import type { CreateUserMemberRoute, ListUserEnrollmentsRoute, ListUserMembersRoute, UpdateUserMemberRoute } from "./user.routes.js";

import { db } from "../../db/index.js";
import { enrollmentTable } from "../../db/schema/enrollment.js";
import { memberRecordTable } from "../../db/schema/member-record.js";
import { programsTable } from "../../db/schema/program.js";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "../../lib/constants.js";
import { oreToKroner } from "../../lib/currency.js";

export const listUserEnrollments: AppRouteHandler<ListUserEnrollmentsRoute> = async (c) => {
  const user = c.var.user;
  
  if (!user) {
    return c.json(
      { message: "Unauthorized" },
      HttpStatusCodes.UNAUTHORIZED
    );
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
    .where(eq(memberRecordTable.userId, user.id))
    .orderBy(desc(enrollmentTable.signedUpAt));

  const result = enrollments.map((row) => ({
    enrollmentId: row.enrollmentId,
    memberRecordId: row.memberRecordId,
    programId: row.programId,
    memberRecordName: `${row.memberFirstName} ${row.memberLastName}`,
    programName: row.programName,
    programPrice: oreToKroner(row.programPriceOre),
    enrollmentStatus: row.enrollmentStatus,
    signedUpAt: row.signedUpAt.toISOString(),
    startDate: row.startDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
    endDate: row.endDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
  }));

  return c.json(result, HttpStatusCodes.OK);
};

export const listUserMembers: AppRouteHandler<ListUserMembersRoute> = async (c) => {
  const user = c.var.user;

  if (!user) {
    return c.json(
      { message: "Unauthorized" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const memberRecords = await db.query.memberRecordTable.findMany({
    where(fields, operators) {
      return operators.eq(fields.userId, user.id);
    },
  });

  return c.json(memberRecords, HttpStatusCodes.OK);
};

export const createUserMember: AppRouteHandler<CreateUserMemberRoute> = async (c) => {
  const user = c.var.user;

  if (!user) {
    return c.json(
      { message: "Unauthorized" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const memberData = c.req.valid("json");

  // Add userId from authenticated session
  const memberToInsert = {
    ...memberData,
    userId: user.id,
  };

  const [created] = await db
    .insert(memberRecordTable)
    .values(memberToInsert)
    .returning();

  return c.json(created, HttpStatusCodes.CREATED);
};

export const updateUserMember: AppRouteHandler<UpdateUserMemberRoute> = async (c) => {
  const user = c.var.user;

  if (!user) {
    return c.json(
      { message: "Unauthorized" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const { id } = c.req.valid("param");
  const updates = c.req.valid("json");

  if (Object.keys(updates).length === 0) {
    return c.json(
      {
        success: false,
        error: {
          issues: [
            {
              code: ZOD_ERROR_CODES.INVALID_UPDATES,
              path: [],
              message: ZOD_ERROR_MESSAGES.NO_UPDATES,
            },
          ],
          name: "ZodError",
        },
      },
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  const [updated] = await db
    .update(memberRecordTable)
    .set(updates)
    .where(and(eq(memberRecordTable.id, id), eq(memberRecordTable.userId, user.id)))
    .returning();

  if (!updated) {
    return c.json(
      { message: "Not Found" },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(updated, HttpStatusCodes.OK);
};
