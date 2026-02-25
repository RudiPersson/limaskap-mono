import { eq } from "drizzle-orm";

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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ message: "Invalid id" }, { status: 422 });
  }

  const result = await db
    .select({
      organization: organizationTable,
      program: programsTable,
    })
    .from(organizationTable)
    .leftJoin(programsTable, eq(organizationTable.id, programsTable.organizationId))
    .where(eq(organizationTable.id, id));

  if (result.length === 0) {
    return notFound();
  }

  const organizationWithPrograms = {
    ...result[0].organization,
    programs: result.filter(row => row.program !== null).map(row => convertProgramPrice(row.program!)),
  };

  return Response.json(organizationWithPrograms);
}
