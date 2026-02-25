import {
  createProgramInputSchema,
  toProgramDto,
  toProgramInsertValues,
  toProgramUpdateValues,
  updateProgramInputSchema,
} from "@/features/programs/server/contracts";
import { ProgramUpdatesRequiredError } from "@/features/programs/server/errors";
import * as repository from "@/features/programs/server/repository";
import { ValidationDomainError, toZodErrorPayload } from "@/lib/server/errors";

export async function listPrograms() {
  const programs = await repository.listPrograms();
  return programs.map(toProgramDto);
}

export async function getProgramById(id: number) {
  const program = await repository.getProgramById(id);
  if (!program) {
    return null;
  }

  return toProgramDto(program);
}

export async function createProgram(input: unknown) {
  const parsed = createProgramInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationDomainError("Validation error", toZodErrorPayload(parsed.error));
  }

  const inserted = await repository.createProgram(toProgramInsertValues(parsed.data));
  return toProgramDto(inserted);
}

export async function updateProgram(id: number, input: unknown) {
  const parsed = updateProgramInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationDomainError("Validation error", toZodErrorPayload(parsed.error));
  }

  if (Object.keys(parsed.data).length === 0) {
    throw new ProgramUpdatesRequiredError();
  }

  const updated = await repository.updateProgram(id, toProgramUpdateValues(parsed.data));

  if (!updated) {
    return null;
  }

  return toProgramDto(updated);
}

export async function deleteProgram(id: number) {
  const result = await repository.deleteProgram(id);
  return (result.rowCount ?? 0) > 0;
}
