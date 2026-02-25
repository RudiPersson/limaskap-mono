import {
  createOrganizationInputSchema,
  OrganizationWithProgramCountsDto,
  OrganizationWithProgramsDto,
} from "@/features/organizations/server/contracts";
import * as repository from "@/features/organizations/server/repository";
import {
  toProgramDto,
  toProgramWithEnrollmentCountDto,
} from "@/features/programs/server/contracts";
import { ValidationDomainError, toZodErrorPayload } from "@/lib/server/errors";

export async function getOrganizations() {
  return repository.listOrganizations();
}

export async function getOrganizationById(id: number) {
  return repository.getOrganizationById(id);
}

export async function getOrganizationBySubdomain(subdomain: string) {
  return repository.getOrganizationBySubdomain(subdomain);
}

export async function getOrganizationWithProgramsById(
  id: number,
): Promise<OrganizationWithProgramsDto | null> {
  const rows = await repository.getOrganizationWithProgramsById(id);

  if (rows.length === 0) {
    return null;
  }

  return {
    ...rows[0].organization,
    programs: rows.filter((row) => row.program !== null).map((row) => toProgramDto(row.program!)),
  };
}

export async function getOrganizationProgramsBySubdomain(
  subdomain: string,
): Promise<OrganizationWithProgramCountsDto | null> {
  const organization = await repository.getOrganizationBySubdomain(subdomain);

  if (!organization) {
    return null;
  }

  const rows = await repository.listProgramsWithEnrollmentCountsByOrganizationId(
    organization.id,
  );

  return {
    ...organization,
    programs: rows.map((row) =>
      toProgramWithEnrollmentCountDto(row.program, Number(row.enrollmentCount)),
    ),
  };
}

export async function getOrganizationProgramBySubdomain(
  subdomain: string,
  programId: number,
) {
  const program = await repository.getProgramBySubdomainAndId(subdomain, programId);

  if (!program) {
    return null;
  }

  return toProgramDto(program);
}

export async function createOrganization(input: unknown) {
  const parsed = createOrganizationInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationDomainError("Validation error", toZodErrorPayload(parsed.error));
  }

  return repository.createOrganization(parsed.data);
}
