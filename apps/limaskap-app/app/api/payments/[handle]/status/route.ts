import { getPaymentStatusByHandle } from "@/features/payments/server/service";
import { notFound } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;

  const paymentStatus = await getPaymentStatusByHandle(handle);
  if (!paymentStatus) {
    return notFound("Payment not found");
  }

  return Response.json(paymentStatus);
}
