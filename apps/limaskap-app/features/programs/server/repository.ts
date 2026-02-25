import { eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { programsTable } from "@/lib/server/db/schema/program";

export async function listPrograms() {
  return db.query.programsTable.findMany();
}

export async function getProgramById(id: number) {
  return db.query.programsTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });
}

export async function createProgram(values: typeof programsTable.$inferInsert) {
  const [inserted] = await db.insert(programsTable).values(values).returning();
  return inserted;
}

export async function updateProgram(
  id: number,
  values: Partial<typeof programsTable.$inferInsert>,
) {
  const [updated] = await db
    .update(programsTable)
    .set(values)
    .where(eq(programsTable.id, id))
    .returning();

  return updated;
}

export async function deleteProgram(id: number) {
  return db.delete(programsTable).where(eq(programsTable.id, id));
}
