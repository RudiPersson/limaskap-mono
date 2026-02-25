import { db } from "@/lib/server/db";
import { insertProgramsSchema, programsTable } from "@/lib/server/db/schema/program";
import { kronerToOre, oreToKroner } from "@/lib/server/currency";
import { zodErrorResponse } from "@/lib/server/http";

export const runtime = "nodejs";

function convertProgramPrice<T extends { price: number }>(program: T): T {
  return {
    ...program,
    price: oreToKroner(program.price),
  };
}

function convertInputPrice<T extends { price: number }>(input: T): T {
  return {
    ...input,
    price: kronerToOre(input.price),
  };
}

export async function GET() {
  const programs = await db.query.programsTable.findMany();
  return Response.json(programs.map(convertProgramPrice));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = insertProgramsSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const [inserted] = await db
    .insert(programsTable)
    .values(convertInputPrice(parsed.data))
    .returning();

  return Response.json(convertProgramPrice(inserted));
}
