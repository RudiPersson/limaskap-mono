import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdParamsSchema } from "stoker/openapi/schemas";

import { createUserMemberRecordSchema, patchUserMemberRecordSchema, selectMemberRecordSchema } from "../../db/schema/member-record.js";
import { notFoundSchema } from "../../lib/constants.js";

const tags = ["User"];

const userEnrollmentSchema = z.object({
  enrollmentId: z.number().int(),
  memberRecordId: z.number().int(),
  programId: z.number().int(),
  memberRecordName: z.string(),
  programName: z.string(),
  programPrice: z.number(),
  enrollmentStatus: z.enum(["CONFIRMED", "WAITLISTED", "CANCELLED"]),
  signedUpAt: z.string().datetime({ offset: true }),
  startDate: z.string().date(),
  endDate: z.string().date(),
});

export const listUserEnrollments = createRoute({
  path: "/user/enrollments",
  method: "get",
  tags,
  summary: "List my enrollments",
  description: "List all enrollments for the authenticated user's member records",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(userEnrollmentSchema),
      "The list of user enrollments"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Unauthorized"
    ),
  },
});

export type ListUserEnrollmentsRoute = typeof listUserEnrollments;

export const listUserMembers = createRoute({
  path: "/user/members",
  method: "get",
  tags,
  summary: "List my member records",
  description: "Get all member records for the authenticated user",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(selectMemberRecordSchema),
      "The list of member records for the authenticated user"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized - user must be authenticated"
    ),
  },
});

export type ListUserMembersRoute = typeof listUserMembers;

export const createUserMember = createRoute({
  path: "/user/members",
  method: "post",
  tags,
  summary: "Create my member record",
  description: "Create a new member record for the authenticated user",
  request: {
    body: jsonContentRequired(
      createUserMemberRecordSchema,
      "The member record to create"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectMemberRecordSchema,
      "The created member record"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized - user must be authenticated"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(createUserMemberRecordSchema),
      "The validation error(s)"
    ),
  },
});

export type CreateUserMemberRoute = typeof createUserMember;

export const updateUserMember = createRoute({
  path: "/user/members/{id}",
  method: "patch",
  tags,
  summary: "Update my member record",
  description: "Partially update a member record owned by the authenticated user",
  request: {
    params: IdParamsSchema,
    body: jsonContentRequired(patchUserMemberRecordSchema, "The member updates"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectMemberRecordSchema,
      "The updated member record"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized - user must be authenticated"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Member record not found"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchUserMemberRecordSchema).or(createErrorSchema(IdParamsSchema)),
      "The validation error(s)"
    ),
  },
});

export type UpdateUserMemberRoute = typeof updateUserMember;
