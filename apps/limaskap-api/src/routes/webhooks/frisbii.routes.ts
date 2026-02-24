import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createMessageObjectSchema } from "stoker/openapi/schemas";

const tags = ["Webhooks"];

// Frisbii webhook payload schema
// Based on: https://docs.frisbii.com/docs/webhooks
export const frisbiiWebhookPayloadSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  event_type: z.string(),
  timestamp: z.string(),
  signature: z.string(),
  customer: z.string().optional(),
  payment_method: z.string().optional(),
  payment_method_reference: z.string().optional(),
  subscription: z.string().optional(),
  invoice: z.string().optional(),
  dispute: z.string().optional(),
  transaction: z.string().optional(),
  credit_note: z.string().optional(),
  credit: z.string().optional(),
}).passthrough(); // Allow additional fields per Frisbii docs

export const webhookRoute = createRoute({
  path: "/webhooks/frisbii",
  method: "post",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: frisbiiWebhookPayloadSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createMessageObjectSchema("ok"),
      "Webhook received and processed successfully"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema("Unauthorized"),
      "Invalid webhook signature"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      createMessageObjectSchema("Bad request"),
      "Invalid webhook payload"
    ),
  },
});

export type WebhookRoute = typeof webhookRoute;

