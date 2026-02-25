import { db } from "@/lib/server/db";
import { notFound } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceHandle: string }> },
) {
  const { invoiceHandle } = await params;

  const enrollment = await db.query.enrollmentTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.invoiceHandle, invoiceHandle);
    },
  });

  if (!enrollment) {
    return notFound("Enrollment not found");
  }

  return Response.json(enrollment);
}
