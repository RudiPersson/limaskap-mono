import { createHmac } from "node:crypto";

import {
  EVENT_TO_INVOICE_STATUS,
  InvoiceEventType,
  frisbiiWebhookPayloadSchema,
} from "@/features/webhooks/server/contracts";
import { InvalidWebhookSignatureError } from "@/features/webhooks/server/errors";
import * as repository from "@/features/webhooks/server/repository";
import { BadRequestDomainError } from "@/lib/server/errors";

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

export async function processFrisbiiWebhook(input: unknown) {
  const parsed = frisbiiWebhookPayloadSchema.safeParse(input);

  if (!parsed.success) {
    throw new BadRequestDomainError("Bad request");
  }

  const payload = parsed.data;
  const { id, event_id, event_type, timestamp, signature, invoice } = payload;

  if (!(event_type in EVENT_TO_INVOICE_STATUS)) {
    return;
  }

  if (!invoice) {
    return;
  }

  const row = await repository.getWebhookContextByInvoiceHandle(invoice);

  if (!row) {
    return;
  }

  if (row.organization.paymentWebhookSecret) {
    const valid = verifyWebhookSignature(id, timestamp, signature, row.organization.paymentWebhookSecret);
    if (!valid) {
      throw new InvalidWebhookSignatureError();
    }
  }

  try {
    await repository.insertWebhookEvent({
      webhookId: id,
      eventId: event_id,
      eventType: event_type,
      organizationId: row.organization.id,
      payload: payload as Record<string, unknown>,
    });
  } catch {
    return;
  }

  const newInvoiceStatus = EVENT_TO_INVOICE_STATUS[event_type as InvoiceEventType];

  await repository.updateEnrollmentInvoiceStatus(row.enrollment.id, newInvoiceStatus);

  const paymentStatusUpdate =
    event_type === "invoice_settled"
      ? { status: "SUCCEEDED" as const, enrollmentPaymentStatus: "PAID" as const }
      : event_type === "invoice_failed" || event_type === "invoice_cancelled"
        ? { status: "FAILED" as const, enrollmentPaymentStatus: "FAILED" as const }
        : { status: "PENDING" as const, enrollmentPaymentStatus: "PENDING" as const };

  await repository.updatePaymentStatusForEnrollment(
    row.enrollment.id,
    paymentStatusUpdate.status,
    invoice,
  );

  await repository.updateEnrollmentPaymentStatus(
    row.enrollment.id,
    paymentStatusUpdate.enrollmentPaymentStatus,
  );

  await repository.markWebhookEventProcessed(id);
}
