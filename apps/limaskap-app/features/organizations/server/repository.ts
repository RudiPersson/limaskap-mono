import { and, count, eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { enrollmentTable } from "@/lib/server/db/schema/enrollment";
import { organizationTable } from "@/lib/server/db/schema/organization";
import { programsTable } from "@/lib/server/db/schema/program";

export async function listOrganizations() {
  return db.query.organizationTable.findMany();
}

export async function getOrganizationById(id: number) {
  return db.query.organizationTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });
}

export async function getOrganizationBySubdomain(subdomain: string) {
  return db.query.organizationTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.subdomain, subdomain);
    },
  });
}

export async function createOrganization(
  values: typeof organizationTable.$inferInsert,
) {
  const [inserted] = await db.insert(organizationTable).values(values).returning();
  return inserted;
}

export async function getOrganizationWithProgramsById(id: number) {
  return db
    .select({
      organization: organizationTable,
      program: programsTable,
    })
    .from(organizationTable)
    .leftJoin(programsTable, eq(organizationTable.id, programsTable.organizationId))
    .where(eq(organizationTable.id, id));
}

export async function listProgramsWithEnrollmentCountsByOrganizationId(
  organizationId: number,
) {
  return db
    .select({
      program: programsTable,
      enrollmentCount: count(enrollmentTable.id),
    })
    .from(programsTable)
    .leftJoin(enrollmentTable, eq(programsTable.id, enrollmentTable.programId))
    .where(eq(programsTable.organizationId, organizationId))
    .groupBy(programsTable.id);
}

export async function getProgramBySubdomainAndId(
  subdomain: string,
  programId: number,
) {
  const rows = await db
    .select({
      program: programsTable,
    })
    .from(programsTable)
    .innerJoin(organizationTable, eq(programsTable.organizationId, organizationTable.id))
    .where(and(eq(organizationTable.subdomain, subdomain), eq(programsTable.id, programId)))
    .limit(1);

  return rows[0]?.program ?? null;
}
