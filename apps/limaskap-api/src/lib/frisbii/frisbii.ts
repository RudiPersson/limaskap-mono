import { Buffer } from "node:buffer";
import z from "zod";



const FRISBII_API_BASE = "https://checkout-api.frisbii.com";
export interface FrisbiiCustomer {
    email: string;
    handle?: string;
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

export interface CheckoutResponse {
    orderId: string;
    checkoutUrl: string;
    raw: unknown;
}

export const CheckoutResponseSchema = z.object({
    orderId: z.string().openapi({
        example: "123-313-1313",
    }),
    checkoutUrl: z.string().openapi({
        example: "https://checkout-api.reepay.com/dad?id=cs_e2c4a750914f383351878b7cdb43e2f1&invoice=member-4-2cf76e49-44ca-4c47-a73c-837d9584a932&customer=dadad%40dadad.com",
    }),
    raw: z.unknown().openapi({
        example: null,
    }),
  });



/**
 * Create a hosted checkout session with Frisbii
 */
export async function createHostedCheckout(
    params: CreateCheckoutParams
): Promise<CheckoutResponse> {
    const {
        ordertext,
        apiKey,
        amount,
        currency,
        handle,
        successUrl,
        cancelUrl,
        customer,
    } = params;

    const requestBody = {
        order: {
            handle,
            amount,
            currency,
            customer,
            ordertext,
        },
         settle: true,
        accept_url: successUrl,
        cancel_url: cancelUrl,
    };

    const response = await fetch(`${FRISBII_API_BASE}/v1/session/charge`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Frisbii checkout creation failed: ${response.status} ${errorText}`
        );
    }

    const data = await response.json();

    // Extract the checkout URL and order ID from Frisbii response
    // Based on docs, the response includes an 'id' and 'url' field
    return {
        orderId: data.id || handle,
        checkoutUrl: data.url,
        raw: data,
    };
}


