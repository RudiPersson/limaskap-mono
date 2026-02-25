import { z } from "zod";

import {
  ProgramDto,
  ProgramWithEnrollmentCountDto,
} from "@/features/programs/server/contracts";
import {
  insertOrganizationSchema,
  selectOrganizationSchema,
} from "@/lib/server/db/schema/organization";

export const createOrganizationInputSchema = insertOrganizationSchema;

export type OrganizationRecord = z.infer<typeof selectOrganizationSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationInputSchema>;

export type OrganizationDto = OrganizationRecord;

export type OrganizationWithProgramsDto = OrganizationDto & {
  programs: ProgramDto[];
};

export type OrganizationWithProgramCountsDto = OrganizationDto & {
  programs: ProgramWithEnrollmentCountDto[];
};
