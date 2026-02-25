import { z } from "zod";

export const createChargeSessionInputSchema = z.object({
  enrollmentId: z.number().int().positive(),
  currency: z.string().length(3).optional().default("DKK"),
  acceptPath: z.string().optional().default("/payment/success"),
  cancelPath: z.string().optional().default("/payment/cancel"),
});

export type CreateChargeSessionInput = z.infer<typeof createChargeSessionInputSchema>;

export type PaymentStatusDto = {
  handle: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  enrollmentPaymentStatus: "NONE" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  amount: number;
  currency: string;
  frisbiiRefs: {
    sessionId: string | null;
    chargeId: string | null;
    invoiceHandle: string | null;
    transactionId: string | null;
  };
  createdAt: string;
  updatedAt: string;
};
