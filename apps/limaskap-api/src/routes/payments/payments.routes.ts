import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema } from "stoker/openapi/schemas";

import { notFoundSchema } from "../../lib/constants.js";

// Request schemas
export const createChargeSessionSchema = z.object({
  enrollmentId: z.number().int().positive(),
  currency: z.string().length(3).optional().default("DKK"),
  acceptPath: z.string().optional().default("/payment/success"),
  cancelPath: z.string().optional().default("/payment/cancel"),
});

// Response schemas
export const chargeSessionResponseSchema = z.object({
  sessionId: z.string(),
  checkoutUrl: z.string().url(),
  paymentHandle: z.string(),
});

export const paymentStatusResponseSchema = z.object({
  handle: z.string(),
  status: z.enum(["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"]),
  enrollmentPaymentStatus: z.enum(["NONE", "PENDING", "PAID", "FAILED", "REFUNDED"]),
  amount: z.number().int(),
  currency: z.string(),
  frisbiiRefs: z.object({
    sessionId: z.string().nullable(),
    chargeId: z.string().nullable(),
    invoiceHandle: z.string().nullable(),
    transactionId: z.string().nullable(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Routes
export const createChargeSessionRoute = createRoute({
  path: "/payments/session/charge",
  method: "post",
  tags: ["payments"],
  request: {
    body: jsonContentRequired(
      createChargeSessionSchema,
      "Charge session creation request"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      chargeSessionResponseSchema,
      "Charge session created successfully"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Enrollment not found"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Invalid request"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(createChargeSessionSchema),
      "Validation error"
    ),
  },
});

export const getPaymentStatusRoute = createRoute({
  path: "/payments/:handle/status",
  method: "get",
  tags: ["payments"],
  request: {
    params: z.object({
      handle: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      paymentStatusResponseSchema,
      "Payment status retrieved successfully"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Payment not found"
    ),
  },
});

export type CreateChargeSessionRoute = typeof createChargeSessionRoute;
export type GetPaymentStatusRoute = typeof getPaymentStatusRoute;

