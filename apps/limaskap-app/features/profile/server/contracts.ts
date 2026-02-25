import { z } from "zod";

import { oreToKroner } from "@/lib/server/currency";
import {
  createUserMemberRecordSchema,
  patchUserMemberRecordSchema,
  selectMemberRecordSchema,
} from "@/lib/server/db/schema/member-record";

export const createUserMemberInputSchema = createUserMemberRecordSchema;
export const updateUserMemberInputSchema = patchUserMemberRecordSchema;

export type MemberRecord = z.infer<typeof selectMemberRecordSchema>;
export type CreateUserMemberInput = z.infer<typeof createUserMemberInputSchema>;
export type UpdateUserMemberInput = z.infer<typeof updateUserMemberInputSchema>;

export type UserEnrollmentDto = {
  enrollmentId: number;
  memberRecordId: number;
  programId: number;
  memberRecordName: string;
  programName: string;
  programPrice: number;
  enrollmentStatus: "CONFIRMED" | "WAITLISTED" | "CANCELLED";
  signedUpAt: string;
  startDate: string;
  endDate: string;
};

export function toUserEnrollmentDto(row: {
  enrollmentId: number;
  memberRecordId: number;
  programId: number;
  memberFirstName: string;
  memberLastName: string;
  programName: string;
  programPriceOre: number;
  enrollmentStatus: "CONFIRMED" | "WAITLISTED" | "CANCELLED";
  signedUpAt: Date;
  startDate: Date;
  endDate: Date;
}): UserEnrollmentDto {
  return {
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
  };
}
