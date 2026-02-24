import { eq } from "drizzle-orm";
import { createHmac } from "node:crypto";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "../../lib/types.js";
import type { WebhookRoute } from "./frisbii.routes.js";

import { db } from "../../db/index.js";
import { enrollmentTable } from "../../db/schema/enrollment.js";
import { webhookEventTable } from "../../db/schema/payment.js";

// Event type to invoice status mapping
const EVENT_TO_INVOICE_STATUS = {
  invoice_authorized: "AUTHORIZED",
  invoice_settled: "SETTLED",
  invoice_cancelled: "CANCELLED",
  invoice_failed: "FAILED",
  invoice_dunning: "DUNNING",
  invoice_created: "CREATED",
} as const;

type InvoiceEventType = keyof typeof EVENT_TO_INVOICE_STATUS;

/**
 * Verify webhook signature using HMAC-SHA256
 */
function verifyWebhookSignature(
  webhookId: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  const payload = timestamp + webhookId;
  const computedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return computedSignature === signature;
}

/**
 * Handler for POST /api/webhooks/frisbii
 * Processes Frisbii webhook events and updates enrollment invoice status
 */
export const webhook: AppRouteHandler<WebhookRoute> = async (c) => {
  const logger = c.var.logger;
  const payload = c.req.valid("json");

  const { id, event_id, event_type, timestamp, signature, invoice } = payload;

  logger.info(
    { webhookId: id, eventId: event_id, eventType: event_type, invoice },
    "Received Frisbii webhook"
  );

  // Check if invoice event type is one we handle
  if (!Object.keys(EVENT_TO_INVOICE_STATUS).includes(event_type)) {
    logger.info({ eventType: event_type }, "Ignoring unhandled event type");
    return c.json({ message: "ok" }, HttpStatusCodes.OK);
  }

  // Check if we have an invoice handle to correlate
  if (!invoice) {
    logger.warn({ eventType: event_type }, "Invoice handle missing in webhook");
    return c.json({ message: "ok" }, HttpStatusCodes.OK);
  }

  // Find enrollment by invoice handle
  const enrollment = await db.query.enrollmentTable.findFirst({
    where: eq(enrollmentTable.invoiceHandle, invoice),
    with: {
      program: {
        with: {
          organization: true,
        },
      },
    },
  });

  if (!enrollment) {
    logger.warn({ invoice }, "Enrollment not found for invoice handle");
    return c.json({ message: "ok" }, HttpStatusCodes.OK);
  }

  const organization = enrollment.program.organization;

  // Verify signature if webhook secret is configured
  if (organization.paymentWebhookSecret) {
    const isValid = verifyWebhookSignature(
      id,
      timestamp,
      signature,
      organization.paymentWebhookSecret
    );

    if (!isValid) {
      logger.error(
        { webhookId: id, organizationId: organization.id },
        "Invalid webhook signature"
      );
      return c.json(
        { message: "Unauthorized" },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    logger.info({ webhookId: id }, "Webhook signature verified");
  } else {
    logger.info(
      { organizationId: organization.id },
      "No webhook secret configured, skipping signature verification"
    );
  }

  // Idempotency check: try to insert webhook event
  try {
    await db.insert(webhookEventTable).values({
      webhookId: id,
      eventId: event_id,
      eventType: event_type,
      organizationId: organization.id,
      payload: payload as Record<string, unknown>,
    });
  } catch (error) {
    logger.error(error, "Error inserting webhook event");
    // If unique constraint fails, this webhook was already processed
    logger.info({ webhookId: id }, "Webhook already processed (duplicate)");
    return c.json({ message: "ok" }, HttpStatusCodes.OK);
  }

  // Map event type to invoice status
  const newInvoiceStatus = EVENT_TO_INVOICE_STATUS[event_type as InvoiceEventType];

  logger.info(
    {
      enrollmentId: enrollment.id,
      currentStatus: enrollment.invoiceStatus,
      newStatus: newInvoiceStatus,
    },
    "Updating enrollment invoice status"
  );

  // Update enrollment invoice status
  await db
    .update(enrollmentTable)
    .set({ invoiceStatus: newInvoiceStatus })
    .where(eq(enrollmentTable.id, enrollment.id));

  // Mark webhook as processed
  await db
    .update(webhookEventTable)
    .set({ processedAt: new Date() })
    .where(eq(webhookEventTable.webhookId, id));

  logger.info(
    { enrollmentId: enrollment.id, newStatus: newInvoiceStatus },
    "Successfully processed webhook"
  );

  return c.json({ message: "ok" }, HttpStatusCodes.OK);
};

