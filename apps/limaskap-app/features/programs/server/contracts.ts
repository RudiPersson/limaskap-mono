import { z } from "zod";

import { kronerToOre, oreToKroner } from "@/lib/server/currency";
import {
  insertProgramsSchema,
  patchProgramsSchema,
  programsTable,
} from "@/lib/server/db/schema/program";

export const createProgramInputSchema = insertProgramsSchema;
export const updateProgramInputSchema = patchProgramsSchema;

export type ProgramRecord = typeof programsTable.$inferSelect;
export type CreateProgramInput = z.infer<typeof createProgramInputSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramInputSchema>;

export type ProgramDto = Omit<ProgramRecord, "price"> & {
  price: number;
};

export type ProgramWithEnrollmentCountDto = ProgramDto & {
  enrollmentCount: number;
};

export function toProgramDto(program: ProgramRecord): ProgramDto {
  return {
    ...program,
    price: oreToKroner(program.price),
  };
}

export function toProgramWithEnrollmentCountDto(
  program: ProgramRecord,
  enrollmentCount: number,
): ProgramWithEnrollmentCountDto {
  return {
    ...toProgramDto(program),
    enrollmentCount,
  };
}

export function toProgramInsertValues(input: CreateProgramInput): CreateProgramInput {
  return {
    ...input,
    price: kronerToOre(input.price),
  };
}

export function toProgramUpdateValues(input: UpdateProgramInput): UpdateProgramInput {
  if (input.price === undefined) {
    return input;
  }

  return {
    ...input,
    price: kronerToOre(input.price),
  };
}
