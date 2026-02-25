import { z } from "zod";

export const frisbiiWebhookPayloadSchema = z
  .object({
    id: z.string(),
    event_id: z.string(),
    event_type: z.string(),
    timestamp: z.string(),
    signature: z.string(),
    invoice: z.string().optional(),
  })
  .passthrough();

export const EVENT_TO_INVOICE_STATUS = {
  invoice_authorized: "AUTHORIZED",
  invoice_settled: "SETTLED",
  invoice_cancelled: "CANCELLED",
  invoice_failed: "FAILED",
  invoice_dunning: "DUNNING",
  invoice_created: "CREATED",
} as const;

export type FrisbiiWebhookPayload = z.infer<typeof frisbiiWebhookPayloadSchema>;
export type InvoiceEventType = keyof typeof EVENT_TO_INVOICE_STATUS;
