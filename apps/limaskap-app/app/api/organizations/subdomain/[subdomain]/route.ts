import { count, eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { enrollmentTable } from "@/lib/server/db/schema/enrollment";
import { programsTable } from "@/lib/server/db/schema/program";
import { oreToKroner } from "@/lib/server/currency";
import { notFound } from "@/lib/server/http";

export const runtime = "nodejs";

function convertProgramPrice<T extends { price: number }>(program: T): T {
  return {
    ...program,
    price: oreToKroner(program.price),
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;

  const organization = await db.query.organizationTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.subdomain, subdomain);
    },
  });

  if (!organization) {
    return notFound();
  }

  const programsWithCounts = await db
    .select({
      program: programsTable,
      enrollmentCount: count(enrollmentTable.id),
    })
    .from(programsTable)
    .leftJoin(enrollmentTable, eq(programsTable.id, enrollmentTable.programId))
    .where(eq(programsTable.organizationId, organization.id))
    .groupBy(programsTable.id);

  const programs = programsWithCounts.map(row => ({
    ...convertProgramPrice(row.program),
    enrollmentCount: Number(row.enrollmentCount),
  }));

  return Response.json({
    ...organization,
    programs,
  });
}
