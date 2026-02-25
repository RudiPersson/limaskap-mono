import { eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { enrollmentTable } from "@/lib/server/db/schema/enrollment";
import { paymentTable } from "@/lib/server/db/schema/payment";
import { notFound } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;

  const rows = await db
    .select({
      payment: paymentTable,
      enrollment: enrollmentTable,
    })
    .from(paymentTable)
    .innerJoin(enrollmentTable, eq(paymentTable.enrollmentId, enrollmentTable.id))
    .where(eq(paymentTable.handle, handle))
    .limit(1);

  const row = rows[0];

  if (!row) {
    return notFound("Payment not found");
  }

  return Response.json({
    handle: row.payment.handle,
    status: row.payment.status,
    enrollmentPaymentStatus: row.enrollment.paymentStatus,
    amount: row.payment.amount,
    currency: row.payment.currency,
    frisbiiRefs: {
      sessionId: row.payment.sessionId,
      chargeId: row.payment.chargeId,
      invoiceHandle: row.payment.invoiceHandle,
      transactionId: row.payment.transactionId,
    },
    createdAt: row.payment.createdAt.toISOString(),
    updatedAt: row.payment.updatedAt.toISOString(),
  });
}
