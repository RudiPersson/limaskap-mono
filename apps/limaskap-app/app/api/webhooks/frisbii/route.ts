import { eq } from "drizzle-orm";
import { createHmac } from "node:crypto";
import { z } from "zod";

import { db } from "@/lib/server/db";
import { enrollmentTable } from "@/lib/server/db/schema/enrollment";
import { organizationTable } from "@/lib/server/db/schema/organization";
import { paymentTable, webhookEventTable } from "@/lib/server/db/schema/payment";
import { programsTable } from "@/lib/server/db/schema/program";

const frisbiiWebhookPayloadSchema = z
  .object({
    id: z.string(),
    event_id: z.string(),
    event_type: z.string(),
    timestamp: z.string(),
    signature: z.string(),
    invoice: z.string().optional(),
  })
  .passthrough();

const EVENT_TO_INVOICE_STATUS = {
  invoice_authorized: "AUTHORIZED",
  invoice_settled: "SETTLED",
  invoice_cancelled: "CANCELLED",
  invoice_failed: "FAILED",
  invoice_dunning: "DUNNING",
  invoice_created: "CREATED",
} as const;

type InvoiceEventType = keyof typeof EVENT_TO_INVOICE_STATUS;

function verifyWebhookSignature(
  webhookId: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean {
  const payload = timestamp + webhookId;
  const computedSignature = createHmac("sha256", secret).update(payload).digest("hex");
  return computedSignature === signature;
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = frisbiiWebhookPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ message: "Bad request" }, { status: 400 });
  }

  const payload = parsed.data;
  const { id, event_id, event_type, timestamp, signature, invoice } = payload;

  if (!(event_type in EVENT_TO_INVOICE_STATUS)) {
    return Response.json({ message: "ok" });
  }

  if (!invoice) {
    return Response.json({ message: "ok" });
  }

  const rows = await db
    .select({
      enrollment: enrollmentTable,
      organization: organizationTable,
    })
    .from(enrollmentTable)
    .innerJoin(programsTable, eq(enrollmentTable.programId, programsTable.id))
    .innerJoin(organizationTable, eq(programsTable.organizationId, organizationTable.id))
    .where(eq(enrollmentTable.invoiceHandle, invoice))
    .limit(1);

  const row = rows[0];

  if (!row) {
    return Response.json({ message: "ok" });
  }

  if (row.organization.paymentWebhookSecret) {
    const valid = verifyWebhookSignature(id, timestamp, signature, row.organization.paymentWebhookSecret);
    if (!valid) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await db.insert(webhookEventTable).values({
      webhookId: id,
      eventId: event_id,
      eventType: event_type,
      organizationId: row.organization.id,
      payload: payload as Record<string, unknown>,
    });
  } catch {
    return Response.json({ message: "ok" });
  }

  const newInvoiceStatus = EVENT_TO_INVOICE_STATUS[event_type as InvoiceEventType];

  await db.update(enrollmentTable).set({ invoiceStatus: newInvoiceStatus }).where(eq(enrollmentTable.id, row.enrollment.id));

  const paymentStatusUpdate =
    event_type === "invoice_settled"
      ? { status: "SUCCEEDED" as const, enrollmentPaymentStatus: "PAID" as const }
      : event_type === "invoice_failed" || event_type === "invoice_cancelled"
        ? { status: "FAILED" as const, enrollmentPaymentStatus: "FAILED" as const }
        : { status: "PENDING" as const, enrollmentPaymentStatus: "PENDING" as const };

  await db
    .update(paymentTable)
    .set({
      status: paymentStatusUpdate.status,
      invoiceHandle: invoice,
    })
    .where(eq(paymentTable.enrollmentId, row.enrollment.id));

  await db
    .update(enrollmentTable)
    .set({ paymentStatus: paymentStatusUpdate.enrollmentPaymentStatus })
    .where(eq(enrollmentTable.id, row.enrollment.id));

  await db
    .update(webhookEventTable)
    .set({ processedAt: new Date() })
    .where(eq(webhookEventTable.webhookId, id));

  return Response.json({ message: "ok" });
}
