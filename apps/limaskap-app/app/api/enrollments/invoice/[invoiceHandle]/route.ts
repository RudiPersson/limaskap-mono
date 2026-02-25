import { getEnrollmentByInvoiceHandle } from "@/features/enrollments/server/service";
import { notFound } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceHandle: string }> },
) {
  const { invoiceHandle } = await params;

  const enrollment = await getEnrollmentByInvoiceHandle(invoiceHandle);

  if (!enrollment) {
    return notFound("Enrollment not found");
  }

  return Response.json(enrollment);
}
