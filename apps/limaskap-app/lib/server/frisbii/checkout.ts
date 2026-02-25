import { z } from "zod";

import { createFrisbiiClient } from "@/lib/server/frisbii/client";

export interface FrisbiiCustomer {
  email: string;
  handle: string;
  first_name?: string;
  last_name?: string;
}

export interface CreateCheckoutParams {
  handle: string;
  apiKey: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customer: FrisbiiCustomer;
  ordertext?: string;
}

export const checkoutResponseSchema = z.object({
  orderId: z.string(),
  checkoutUrl: z.string().url(),
  raw: z.unknown(),
});

export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;

export async function createHostedCheckout(
  params: CreateCheckoutParams,
): Promise<CheckoutResponse> {
  const client = createFrisbiiClient(params.apiKey);
  const response = await client.createChargeSession({
    order: {
      handle: params.handle,
      amount: params.amount,
      currency: params.currency,
      customer: params.customer,
      ordertext: params.ordertext,
    },
    settle: true,
    locale: "da_DK",
    accept_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return {
    orderId: response.id || params.handle,
    checkoutUrl: response.url,
    raw: response,
  };
}
