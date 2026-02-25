import { and, eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { organizationTable } from "@/lib/server/db/schema/organization";
import { programsTable } from "@/lib/server/db/schema/program";
import { oreToKroner } from "@/lib/server/currency";
import { notFound, parseId } from "@/lib/server/http";

export const runtime = "nodejs";

function convertProgramPrice<T extends { price: number }>(program: T): T {
  return {
    ...program,
    price: oreToKroner(program.price),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; programId: string }> },
) {
  const { id, programId: rawProgramId } = await params;
  const subdomain = id;
  const programId = parseId(rawProgramId);

  if (!programId) {
    return Response.json({ message: "Invalid programId" }, { status: 422 });
  }

  const result = await db
    .select({
      program: programsTable,
    })
    .from(programsTable)
    .innerJoin(organizationTable, eq(programsTable.organizationId, organizationTable.id))
    .where(and(eq(organizationTable.subdomain, subdomain), eq(programsTable.id, programId)));

  if (result.length === 0) {
    return notFound("Organization or program not found");
  }

  return Response.json(convertProgramPrice(result[0].program));
}
