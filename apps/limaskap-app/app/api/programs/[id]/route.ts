import { eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { patchProgramsSchema, programsTable } from "@/lib/server/db/schema/program";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/server/constants";
import { kronerToOre, oreToKroner } from "@/lib/server/currency";
import { notFound, parseId, zodErrorResponse } from "@/lib/server/http";

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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ message: "Invalid id" }, { status: 422 });
  }

  const program = await db.query.programsTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });

  if (!program) {
    return notFound("Program not found");
  }

  return Response.json(convertProgramPrice(program));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ message: "Invalid id" }, { status: 422 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchProgramsSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const updates = parsed.data;

  if (Object.keys(updates).length === 0) {
    return Response.json(
      {
        success: false,
        error: {
          issues: [
            {
              code: ZOD_ERROR_CODES.INVALID_UPDATES,
              path: [],
              message: ZOD_ERROR_MESSAGES.NO_UPDATES,
            },
          ],
          name: "ZodError",
        },
      },
      { status: 422 },
    );
  }

  const updatesWithOrePrice =
    updates.price !== undefined
      ? convertInputPrice(updates as typeof updates & { price: number })
      : updates;

  const [program] = await db
    .update(programsTable)
    .set(updatesWithOrePrice)
    .where(eq(programsTable.id, id))
    .returning();

  if (!program) {
    return notFound("Program not found");
  }

  return Response.json(convertProgramPrice(program));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ message: "Invalid id" }, { status: 422 });
  }

  const result = await db.delete(programsTable).where(eq(programsTable.id, id));

  if (result.rowCount === 0) {
    return notFound("Program not found");
  }

  return new Response(null, { status: 204 });
}
