# Frisbii Payment Integration - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                          │
│                    https://{org}.limaskap.fo                        │
└────────────┬───────────────────────────────────────┬────────────────┘
             │                                       │
             │ 1. POST /api/payments/session/charge │
             │    { enrollmentId: 1 }                │
             │                                       │
             ▼                                       │
┌─────────────────────────────────────────────────────────────────────┐
│                      Limaskap API (Hono)                            │
│                   https://api.limaskap.fo                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Payment Handler                                              │  │
│  │ ─────────────────                                            │  │
│  │ 1. Load enrollment + program + organization (join)          │  │
│  │ 2. Validate org has paymentApiKey                           │  │
│  │ 3. Generate payment handle: member-{id}-{uuid}              │  │
│  │ 4. Build tenant URLs: https://{sub}.limaskap.fo/...         │  │
│  │ 5. Call Frisbii API to create session                       │  │
│  │ 6. Store payment record (status: PENDING)                   │  │
│  │ 7. Update enrollment (paymentStatus: PENDING)               │  │
│  │ 8. Return { sessionId, checkoutUrl, paymentHandle }         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ 2. Frisbii API Call
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Frisbii API                                 │
│                    https://api.frisbii.com                          │
│                                                                     │
│  POST /v1/session/charge                                           │
│  {                                                                  │
│    order: {                                                         │
│      handle: "member-1-uuid",                                       │
│      amount: 50000,  // øre                                         │
│      currency: "DKK",                                               │
│      customer: { handle, email, name, address },                    │
│      settle: true  // Direct settle                                 │
│    },                                                               │
│    accept_url: "https://hf.limaskap.fo/payment/success",            │
│    cancel_url: "https://hf.limaskap.fo/payment/cancel"              │
│  }                                                                  │
│                                                                     │
│  Response: { id, url, state, order }                                │
└──────────────────────────────────────────────────────────────────┬──┘
                                                                     │
                               3. Return checkout URL               │
                               ┌──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                               │
│                                                                     │
│  Redirect to:                                                       │
│  https://checkout.frisbii.com/session/{sessionId}                   │
│                                                                     │
│  User completes payment...                                          │
└──────────────────────────────────────────────────────────────────┬──┘
                                                                     │
                               4. User completes payment            │
                               ┌──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Frisbii                                     │
│                                                                     │
│  5a. Redirect user to accept_url                                    │
│      https://hf.limaskap.fo/payment/success?handle=member-1-uuid    │
│                                                                     │
│  5b. Send webhook to backend                                        │
│      POST https://api.limaskap.fo/api/webhooks/frisbii/hf           │
└──────────────────────────────────────────────────────────────────┬──┘
                                                                     │
            ┌────────────────────────────────────────────────────────┤
            │                                                        │
            │ 5b. Webhook                                            │ 5a. Redirect
            ▼                                                        │
┌─────────────────────────────────────────────────────────────────┐  │
│              Webhook Handler (Backend)                          │  │
│              ─────────────────────────                          │  │
│  1. Lookup org by slug (hf)                                     │  │
│  2. Verify HMAC signature using org's webhook secret            │  │
│  3. Check idempotency (webhookId already processed?)            │  │
│  4. Store webhook event                                         │  │
│  5. Fetch invoice from Frisbii (verify state)                   │  │
│  6. Update payment status → SUCCEEDED                           │  │
│  7. Update enrollment paymentStatus → PAID                      │  │
│  8. Mark webhook as processed                                   │  │
│  9. Return 200 OK                                               │  │
└─────────────────────────────────────────────────────────────────┘  │
                                                                     │
                                                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (Payment Success Page)                  │
│                                                                     │
│  Show: "We're confirming your payment..."                           │
│                                                                     │
│  Poll: GET /api/payments/member-1-uuid/status                       │
│        Every 2-3 seconds for up to 30 seconds                       │
│                                                                     │
│  When enrollmentPaymentStatus === "PAID":                           │
│    Show success message & redirect to dashboard                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Payment Initiation

```
User Action (Frontend)
  ↓
Load enrollment details
  ↓
POST /api/payments/session/charge { enrollmentId }
  ↓
Backend: Validate & create Frisbii session
  ↓
Store payment record (PENDING)
  ↓
Return { sessionId, checkoutUrl, paymentHandle }
  ↓
Redirect user to Frisbii checkout
```

### 2. Payment Processing

```
User enters card details in Frisbii checkout
  ↓
Frisbii authorizes & settles payment (direct settle)
  ↓
Frisbii sends webhook to backend (async)
  ↓
Frisbii redirects user to accept_url (async)
```

### 3. Webhook Processing

```
POST /api/webhooks/frisbii/{orgSlug}
  ↓
Lookup organization by slug
  ↓
Verify HMAC signature
  ↓
Check idempotency (webhookId)
  ↓
Store webhook_event
  ↓
Process event:
  - invoice_settled → payment: SUCCEEDED, enrollment: PAID
  - invoice_failed → payment: FAILED, enrollment: FAILED
  ↓
Return 200 OK (within 10s)
```

### 4. Frontend Polling

```
User lands on accept_url
  ↓
Show "Confirming payment..."
  ↓
Poll GET /api/payments/:handle/status every 2-3s
  ↓
Check enrollmentPaymentStatus
  ↓
  ├─ PAID → Show success & redirect
  ├─ FAILED → Show error & retry option
  └─ PENDING → Continue polling (max 30s)
```

---

## Database Schema

```
┌──────────────────────────────────────────────────────────────┐
│                        organization                          │
├──────────────────────────────────────────────────────────────┤
│ id (PK)                                                      │
│ name, slug, subdomain                                        │
│ paymentApiKey (Frisbii API key)                             │
│ paymentWebhookSecret (HMAC secret)                          │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  │ 1:N
                  │
┌─────────────────▼────────────────────────────────────────────┐
│                          program                             │
├──────────────────────────────────────────────────────────────┤
│ id (PK)                                                      │
│ organizationId (FK)                                          │
│ name, description                                            │
│ price (øre)                                                  │
│ startDate, endDate                                           │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  │ 1:N
                  │
┌─────────────────▼────────────────────────────────────────────┐
│                        enrollment                            │
├──────────────────────────────────────────────────────────────┤
│ id (PK)                                                      │
│ programId (FK)                                               │
│ memberId (FK)                                                │
│ status (CONFIRMED, WAITLISTED, CANCELLED)                    │
│ paymentStatus (NONE, PENDING, PAID, FAILED, REFUNDED)       │
│ signedUpAt                                                   │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  │ 1:1
                  │
┌─────────────────▼────────────────────────────────────────────┐
│                          payment                             │
├──────────────────────────────────────────────────────────────┤
│ id (PK, UUID)                                                │
│ handle (unique, "member-{id}-{uuid}")                        │
│ organizationId (FK)                                          │
│ enrollmentId (FK)                                            │
│ amount (øre), currency                                       │
│ status (PENDING, SUCCEEDED, FAILED, REFUNDED)                │
│ ─────────────────────────────────────────────────────────   │
│ sessionId (Frisbii)                                          │
│ chargeId (Frisbii)                                           │
│ invoiceHandle (Frisbii)                                      │
│ transactionId (Frisbii)                                      │
│ ─────────────────────────────────────────────────────────   │
│ directSettle, acceptUrl, cancelUrl                           │
│ createdAt, updatedAt                                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      webhook_event                           │
├──────────────────────────────────────────────────────────────┤
│ id (PK, UUID)                                                │
│ webhookId (unique, from Frisbii)                             │
│ eventId (from Frisbii)                                       │
│ eventType (invoice_settled, invoice_failed, etc.)            │
│ organizationId (FK)                                          │
│ payload (JSONB, full webhook body)                           │
│ processedAt, processingError                                 │
│ receivedAt                                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Payment Endpoints

```
POST /api/payments/session/charge
  Request:  { enrollmentId, currency?, acceptPath?, cancelPath? }
  Response: { sessionId, checkoutUrl, paymentHandle }
  Auth:     Required (Better Auth)

GET /api/payments/:handle/status
  Response: { handle, status, enrollmentPaymentStatus, amount, ... }
  Auth:     Required (Better Auth)
```

### Webhook Endpoint

```
POST /api/webhooks/frisbii/:orgSlug
  Request:  Frisbii webhook payload with HMAC signature
  Response: { success: boolean, message?: string }
  Auth:     HMAC signature verification
```

---

## Security Model

### Multi-Tenancy

- Each organization has its own Frisbii API key
- Webhook routing by organization slug in URL path
- Payment sessions use org-specific credentials
- Tenant isolation enforced at DB query level

### HMAC Verification

```javascript
// Webhook signature verification
const signature = hmac_sha256(
  organization.paymentWebhookSecret,
  timestamp + webhookId
);

if (signature !== webhook.signature) {
  return 401 Unauthorized;
}
```

### Idempotency

- Webhook events de-duplicated by `webhookId` (unique constraint)
- Repeated webhooks return `200 OK` without side effects
- Race conditions handled via DB constraints

### Authorization

- Payment creation requires authenticated user
- User must have access to the enrollment's organization
- Webhook endpoint validates HMAC instead of user auth

---

## Error Scenarios

### 1. Payment Session Creation Fails

**Cause**: Invalid Frisbii API key, network error, invalid data

**Handling**:
- Return `400 Bad Request` with error message
- Log error with full context
- No payment record created
- Enrollment status unchanged

### 2. Webhook Signature Invalid

**Cause**: Wrong secret, tampered data, replay attack

**Handling**:
- Return `401 Unauthorized`
- Log warning with webhook ID
- No processing occurs
- Frisbii will retry (may be legitimate on second attempt if secret was updated)

### 3. Webhook Processing Error

**Cause**: Database error, Frisbii API error, bug in handler

**Handling**:
- Store error in `webhook_event.processing_error`
- Mark as processed to prevent infinite retries
- Return `200 OK` to Frisbii (prevent retries)
- Alert/monitor for investigation

### 4. User Cancels Payment

**Cause**: User clicks "Cancel" in Frisbii checkout

**Handling**:
- User redirected to `cancel_url`
- No webhook sent (no payment made)
- Frontend can offer retry option
- Payment record remains `PENDING`

### 5. Timeout (No Webhook Received)

**Cause**: Network issue, Frisbii delay, webhook blocked

**Handling**:
- Frontend poll timeout (30s)
- Show "Payment status unclear" message
- Offer contact support option
- Manual reconciliation may be needed

---

## Monitoring & Observability

### Key Metrics

- Payment success rate (%)
- Average payment time (webhook latency)
- Webhook processing errors
- HMAC verification failures
- Frisbii API errors

### Log Events

- `payment.session.created`
- `payment.session.error`
- `webhook.received`
- `webhook.signature.invalid`
- `webhook.processed`
- `webhook.error`
- `payment.succeeded`
- `payment.failed`

### Alerts

- Webhook processing errors > threshold
- Payment success rate < threshold
- HMAC failures spike (possible attack)
- Frisbii API errors spike

---

## Deployment Checklist

### Frisbii Configuration

- [ ] Register webhook URL in Frisbii dashboard
- [ ] Enable events: `invoice_settled`, `invoice_failed`
- [ ] Test webhook delivery with sandbox

### Organization Setup

- [ ] Add Frisbii API keys to each organization
- [ ] Add webhook secrets to each organization
- [ ] Verify credentials with test payment

### Infrastructure

- [ ] Deploy migration `0011_demonic_eddie_brock.sql`
- [ ] Ensure webhook endpoint is publicly accessible
- [ ] SSL/TLS certificate valid
- [ ] Webhook endpoint responds within 10 seconds

### Monitoring

- [ ] Set up error alerting
- [ ] Configure log aggregation
- [ ] Create payment metrics dashboard
- [ ] Set up uptime monitoring for webhook endpoint

---

## References

- Implementation Summary: `FRISBII_IMPLEMENTATION_SUMMARY.md`
- Testing Guide: `FRISBII_TESTING.md`
- Frisbii API Client: `src/lib/frisbii/client.ts`
- Payment Handlers: `src/routes/payments/payments.handlers.ts`
- Webhook Handlers: `src/routes/webhooks/frisbii.handlers.ts`

