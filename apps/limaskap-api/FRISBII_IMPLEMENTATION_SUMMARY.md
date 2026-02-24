# Frisbii Payment Integration - Implementation Summary

## Overview

Successfully implemented multi-tenant payment processing using Frisbii Checkout API with per-organization credentials, direct settle charges, and robust webhook handling.

## What Was Implemented

### 1. Database Schema

**New Tables**:

- `payment` - Stores payment records with Frisbii references
  - Fields: handle, organizationId, enrollmentId, amount, currency, status
  - Frisbii refs: sessionId, chargeId, invoiceHandle, transactionId
  - Direct settle flag and redirect URLs
- `webhook_event` - Idempotency and audit trail for webhooks
  - Fields: webhookId (unique), eventId, eventType, organizationId, payload
  - Processing metadata: processedAt, processingError

**Updated Tables**:

- `organization` - Added payment credentials (already existed)
  - `paymentApiKey` - Frisbii API key per organization
  - `paymentWebhookSecret` - HMAC secret for webhook verification

**Relations Added**:

- `payment` ↔ `enrollment` (one-to-one)
- `payment` ↔ `organization` (many-to-one)
- `enrollment` ↔ `program` (many-to-one)
- `enrollment` ↔ `member` (many-to-one)
- `program` ↔ `organization` (many-to-one)

**Migration**: `src/db/migrations/0011_demonic_eddie_brock.sql`

---

### 2. Frisbii API Client

**File**: `src/lib/frisbii/client.ts`

**Features**:

- Typed Zod schemas for all Frisbii API requests/responses
- `FrisbiiClient` class with methods:
  - `createChargeSession()` - Create checkout session
  - `getCharge()` - Fetch charge details
  - `getInvoice()` - Fetch invoice details (for webhook verification)
  - `createCustomer()` / `getCustomer()` - Customer management
- Error handling with `FrisbiiApiError` class
- Configurable base URL (defaults to `https://api.frisbii.com`)

---

### 3. Payment API Endpoints

**Router**: `src/routes/payments/`

#### POST `/api/payments/session/charge`

**Purpose**: Create a Frisbii checkout session for an enrollment

**Request Body**:

```typescript
{
  enrollmentId: number;
  currency?: string; // default: "DKK"
  acceptPath?: string; // default: "/payment/success"
  cancelPath?: string; // default: "/payment/cancel"
}
```

**Flow**:

1. Validates user authentication
2. Loads enrollment + program + organization (single join query)
3. Validates organization has `paymentApiKey`
4. Generates unique payment handle: `member-{enrollmentId}-{uuid}`
5. Builds tenant-specific URLs: `https://{subdomain}.limaskap.fo{path}`
6. Calls Frisbii `/v1/session/charge` with:
   - Direct settle enabled
   - Customer details from member record
   - Order amount from program price (øre)
7. Stores payment record with status `PENDING`
8. Updates enrollment `paymentStatus` to `PENDING`
9. Returns `{ sessionId, checkoutUrl, paymentHandle }`

**Response**:

```typescript
{
  sessionId: string;
  checkoutUrl: string;
  paymentHandle: string;
}
```

#### GET `/api/payments/:handle/status`

**Purpose**: Poll payment status (used by frontend after redirect)

**Response**:

```typescript
{
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
}
```

---

### 4. Webhook Endpoint

**Router**: `src/routes/webhooks/`

#### POST `/api/webhooks/frisbii/:orgSlug`

**Purpose**: Receive and process Frisbii webhook events

**Flow**:

1. Find organization by `orgSlug` in URL
2. Verify HMAC signature:

   ```javascript
   signature = hmac_sha256(secret, timestamp + webhookId)
   ```

   - If invalid → return `401 Unauthorized`

3. Check idempotency: if `webhookId` already processed → return `200 OK`
4. Insert `webhook_event` record (unique constraint on `webhookId`)
5. Process event based on `event_type`:
   - `invoice_settled` / `charge_settled`:
     - Fetch authoritative invoice state from Frisbii API
     - Update `payment.status` → `SUCCEEDED`
     - Update `enrollment.paymentStatus` → `PAID`
     - Store `transactionId` and `invoiceHandle`
   - `invoice_failed` / `charge_failed`:
     - Update `payment.status` → `FAILED`
     - Update `enrollment.paymentStatus` → `FAILED`
6. Mark webhook as processed (set `processedAt`)
7. Return `200 OK` within 10 seconds (Frisbii requirement)

**Error Handling**:

- All errors return `200 OK` to prevent retries
- Errors logged in `webhook_event.processing_error`
- Idempotent design using `webhookId`

**Supported Events**:

- `invoice_settled`
- `charge_settled`
- `invoice_failed`
- `charge_failed`

---

### 5. Security & Multi-Tenancy

**Per-Organization Credentials**:

- Each organization has its own `paymentApiKey` and `paymentWebhookSecret`
- Webhooks are routed by `orgSlug` in URL path
- Payment sessions use org-specific Frisbii API key

**HMAC Verification**:

- All webhooks must provide valid HMAC signature
- Signature calculated as: `hexencode(hmac_sha_256(secret, timestamp + id))`
- Invalid signatures rejected with `401 Unauthorized`

**Idempotency**:

- Webhooks de-duplicated by `webhookId` (unique constraint)
- Repeated webhooks return `200 OK` without reprocessing
- Race conditions handled via DB unique constraint

**Tenant Isolation**:

- Payment sessions derive tenant from `enrollment → program → organization`
- Prevents cross-org payment initiation
- Redirect URLs use organization's `subdomain`

---

### 6. OpenAPI Documentation

All endpoints are documented with:

- Request/response schemas
- HTTP status codes
- Error responses
- Tags for grouping

**Available at**:

- Spec: `GET /doc`
- Interactive UI: `GET /reference`

---

### 7. Logging

**Structured Logging** via `pino`:

- All payment operations logged with context:
  - `enrollmentId`, `organizationId`, `userId`
  - `sessionId`, `paymentHandle`, `webhookId`
  - `eventType`, `status`
- Errors logged with full stack traces
- Webhook processing logged at each stage

**Key Log Events**:

- `"Creating charge session"`
- `"Frisbii session created"`
- `"Received Frisbii webhook"`
- `"Webhook processed successfully"`
- `"Payment marked as succeeded"`
- `"Payment marked as failed"`

---

## Frontend Integration

**Flow**:

1. User selects enrollment → frontend calls `POST /api/payments/session/charge`
2. Frontend redirects user to `checkoutUrl` (Frisbii hosted checkout)
3. User completes payment in Frisbii checkout
4. Frisbii redirects to `accept_url` or `cancel_url`
5. Frontend shows "Confirming payment..." and polls `GET /api/payments/:handle/status`
6. Backend receives webhook and updates status
7. Frontend poll detects `enrollmentPaymentStatus: "PAID"` and shows success

**Accept URL Pattern**:

```
https://{orgSubdomain}.limaskap.fo/payment/success?handle={paymentHandle}
```

**Polling Recommendation**:

- Poll every 2-3 seconds for up to 30 seconds
- Stop when `enrollmentPaymentStatus` is `PAID` or `FAILED`

---

## Configuration Requirements

### Per Organization

Each organization needs:

```sql
UPDATE organization
SET
  payment_api_key = 'frisbii_api_key_here',
  payment_webhook_secret = 'webhook_secret_here'
WHERE slug = 'org-slug';
```

### Frisbii Dashboard

Register webhook URL for each organization:

```
https://api.limaskap.fo/api/webhooks/frisbii/{orgSlug}
```

Enable events:

- `invoice_settled`
- `invoice_failed`

---

## Currency Handling

- All prices stored in **minor units (øre)** in database
- `program.price` is in øre
- Frisbii API expects amounts in minor units
- Frontend should display in kroner using `oreToKroner()` helper

**Example**:

- Program price: `50000` (database)
- Display: `500.00 kr` (frontend)
- Frisbii charge: `50000` (API request)

---

## Direct Settle

All charges use **direct settle**:

- Payment authorized and settled in one step
- No separate capture required
- Funds transferred immediately upon authorization
- Set via `order.settle: true` in Frisbii session request

---

## Testing

See `FRISBII_TESTING.md` for comprehensive testing guide including:

- Manual test scenarios
- Webhook simulation
- HMAC signature calculation
- Test card numbers
- Debugging tips

---

## Files Modified/Created

### Created Files

- `src/db/schema/payment.ts` - Payment and webhook event tables
- `src/lib/frisbii/client.ts` - Frisbii API client
- `src/routes/payments/payments.routes.ts` - Payment route definitions
- `src/routes/payments/payments.handlers.ts` - Payment handlers
- `src/routes/payments/payments.index.ts` - Payment router
- `src/routes/webhooks/frisbii.routes.ts` - Webhook route definitions
- `src/routes/webhooks/frisbii.handlers.ts` - Webhook handlers
- `src/routes/webhooks/frisbii.index.ts` - Webhook router
- `src/db/migrations/0011_demonic_eddie_brock.sql` - Migration
- `FRISBII_TESTING.md` - Testing guide
- `FRISBII_IMPLEMENTATION_SUMMARY.md` - This file

### Modified Files

- `src/app.ts` - Mounted payment and webhook routers
- `src/db/index.ts` - Already had payment schema import
- `src/db/schema/enrollment.ts` - Added relations
- `src/db/schema/program.ts` - Added relations
- `src/db/schema/organization.ts` - Already had payment fields
- `package.json` - Added `uuid` package

---

## Next Steps

### Before Production

1. **Test with Frisbii Sandbox**:
   - Use test API keys
   - Verify all payment flows
   - Test webhook delivery and idempotency

2. **Configure Organizations**:
   - Add production Frisbii API keys
   - Add webhook secrets
   - Register webhook URLs in Frisbii dashboard

3. **Frontend Implementation**:
   - Create payment initiation UI
   - Implement redirect handling
   - Add polling for payment status
   - Display payment success/failure states

4. **Monitoring & Alerts**:
   - Set up alerts for webhook failures
   - Monitor payment success/failure rates
   - Track average payment times

5. **Error Recovery**:
   - Document manual reconciliation process
   - Create admin tools for payment status checks
   - Plan for webhook retry scenarios

### Future Enhancements

- [ ] Refund support via Frisbii API
- [ ] Payment receipt generation and email
- [ ] Admin dashboard for payment analytics
- [ ] Support for multiple currencies beyond DKK
- [ ] Partial payments / installments
- [ ] Subscription recurring payments
- [ ] Payment failure retry mechanism
- [ ] Automated reconciliation reports
- [ ] Webhook replay functionality for debugging

---

## Support & References

**Frisbii Documentation**:

- [Checkout API](https://docs.frisbii.com/reference/session)
- [Charge API](https://docs.frisbii.com/reference/charge)
- [Webhooks](https://docs.frisbii.com/reference/intro_webhooks)
- [Testing](https://docs.frisbii.com/docs/testing)
- [New Web Shop Example](https://docs.frisbii.com/docs/new-web-shop.md)

**Internal Documentation**:

- `FRISBII_TESTING.md` - Testing guide
- `src/lib/frisbii/client.ts` - API client with inline docs
- OpenAPI docs at `/reference` endpoint

---

## Summary

✅ **Completed**:

- Multi-tenant payment architecture
- Frisbii API integration with typed client
- Payment session creation with direct settle
- Webhook handling with HMAC verification
- Idempotent webhook processing
- Database schema and migrations
- OpenAPI documentation
- Structured logging
- Testing documentation

🎯 **Ready For**:

- Frontend integration
- Sandbox testing
- Production deployment (after org configuration)

The implementation follows Frisbii best practices and handles all documented edge cases including idempotency, webhook verification, and multi-tenant isolation.
