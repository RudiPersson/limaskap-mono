/**
 * Frisbii API client
 * Docs: https://docs.frisbii.com/reference
 */

import { Buffer } from "node:buffer";
import { z } from "zod";

// Base Frisbii API URL
// const FRISBII_API_BASE = "https://api.frisbii.com";
const FRISBII_API_BASE = "https://checkout-api.frisbii.com";

// Type definitions for Frisbii API requests and responses

export const frisbiiCustomerSchema = z.object({
  handle: z.string(),
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  address: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  postal_code: z.string().optional(),
});

export const frisbiiOrderSchema = z.object({
  handle: z.string(),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  customer: z.union([z.string(), frisbiiCustomerSchema]),
  ordertext: z.string().optional(),
  order_lines: z.array(z.object({
    ordertext: z.string(),
    amount: z.number().int(),
    quantity: z.number().int().positive().default(1),
  })).optional(),
});

export const frisbiiSessionRequestSchema = z.object({
  order: frisbiiOrderSchema,
  accept_url: z.string().url(),
  cancel_url: z.string().url(),
  settle: z.boolean().optional().default(true), // Direct settle at session level
  locale: z.string().optional().default("da_DK"),
  button_text: z.string().optional(),
  recurring: z.boolean().optional(),
  payment_methods: z.array(z.string()).optional(),
});

export const frisbiiSessionResponseSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  state: z.string(),
  customer: z.string().optional(),
  order: z.object({
    handle: z.string(),
    amount: z.number().int(),
    currency: z.string(),
  }),
});

export const frisbiiChargeSchema = z.object({
  id: z.string(),
  handle: z.string(),
  state: z.string(),
  customer: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  authorized: z.string().optional(),
  settled: z.string().optional(),
  cancelled: z.string().optional(),
  created: z.string(),
  transaction_id: z.string().optional(),
  error: z.string().optional(),
  source: z.object({
    type: z.string(),
    card_type: z.string().optional(),
    exp_date: z.string().optional(),
    masked_card: z.string().optional(),
  }).optional(),
});

export const frisbiiInvoiceSchema = z.object({
  id: z.string(),
  handle: z.string(),
  customer: z.string(),
  subscription: z.string().optional(),
  plan: z.string().optional(),
  state: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  created: z.string(),
  due: z.string().optional(),
  settled: z.string().optional(),
  failed: z.string().optional(),
  authorized_amount: z.number().int().optional(),
  settled_amount: z.number().int().optional(),
  refunded_amount: z.number().int().optional(),
  transactions: z.array(z.object({
    id: z.string(),
    type: z.string(),
    state: z.string(),
    amount: z.number().int(),
    created: z.string(),
  })).optional(),
});

export type FrisbiiCustomer = z.infer<typeof frisbiiCustomerSchema>;
export type FrisbiiOrder = z.infer<typeof frisbiiOrderSchema>;
export type FrisbiiSessionRequest = z.infer<typeof frisbiiSessionRequestSchema>;
export type FrisbiiSessionResponse = z.infer<typeof frisbiiSessionResponseSchema>;
export type FrisbiiCharge = z.infer<typeof frisbiiChargeSchema>;
export type FrisbiiInvoice = z.infer<typeof frisbiiInvoiceSchema>;

export class FrisbiiApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "FrisbiiApiError";
  }
}

/**
 * Frisbii API client
 */
export class FrisbiiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = FRISBII_API_BASE) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    // Frisbii requires HTTP Basic Auth with API key as username and empty password
    // Format: base64(apiKey:)
    const auth = Buffer.from(`${this.apiKey}:`).toString('base64');

    const headers: Record<string, string> = {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    // Log request for debugging (remove API key from logs)
    console.log('Frisbii API Request:', {
      method,
      url,
      hasBody: !!body,
      bodyPreview: body ? JSON.stringify(body).substring(0, 200) : undefined,
    });

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Log more details for debugging
      console.error('Frisbii API Error:', {
        url,
        status: response.status,
        statusText: response.statusText,
        data,
      });

      throw new FrisbiiApiError(
        data.message || `Frisbii API error: ${response.status}`,
        response.status,
        data
      );
    }

    return data as T;
  }

  /**
   * Create a charge session for checkout
   * POST /v1/session/charge
   * https://docs.frisbii.com/reference/session
   */
  async createChargeSession(
    request: FrisbiiSessionRequest
  ): Promise<FrisbiiSessionResponse> {
    const validated = frisbiiSessionRequestSchema.parse(request);
    return this.request<FrisbiiSessionResponse>(
      "POST",
      "/v1/session/charge",
      validated
    );
  }

  /**
   * Get a charge by handle or id
   * GET /v1/charge/{handle}
   * https://docs.frisbii.com/reference/charge
   */
  async getCharge(handleOrId: string): Promise<FrisbiiCharge> {
    return this.request<FrisbiiCharge>("GET", `/v1/charge/${handleOrId}`);
  }

  /**
   * Get an invoice by handle
   * GET /v1/invoice/{handle}
   * https://docs.frisbii.com/reference/invoice
   */
  async getInvoice(handle: string): Promise<FrisbiiInvoice> {
    return this.request<FrisbiiInvoice>("GET", `/v1/invoice/${handle}`);
  }

  /**
   * Create or get a customer
   * POST /v1/customer
   * https://docs.frisbii.com/reference/customer
   */
  async createCustomer(customer: FrisbiiCustomer): Promise<{ handle: string }> {
    const validated = frisbiiCustomerSchema.parse(customer);
    return this.request<{ handle: string }>("POST", "/v1/customer", validated);
  }

  /**
   * Get a customer by handle
   * GET /v1/customer/{handle}
   */
  async getCustomer(handle: string): Promise<FrisbiiCustomer & { handle: string }> {
    return this.request<FrisbiiCustomer & { handle: string }>(
      "GET",
      `/v1/customer/${handle}`
    );
  }
}

/**
 * Create a Frisbii client instance with the provided API key
 */
export function createFrisbiiClient(apiKey: string): FrisbiiClient {
  return new FrisbiiClient(apiKey);
}

