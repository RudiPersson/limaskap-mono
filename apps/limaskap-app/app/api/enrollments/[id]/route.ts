import { db } from "@/lib/server/db";
import { notFound, parseId } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ message: "Invalid id" }, { status: 422 });
  }

  const enrollment = await db.query.enrollmentTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });

  if (!enrollment) {
    return notFound("Enrollment not found");
  }

  return Response.json(enrollment);
}
