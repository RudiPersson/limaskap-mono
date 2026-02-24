# Frisbii Payment Integration - Testing Guide

This document provides manual testing recipes for the Frisbii payment integration in the Limaskap API.

## Prerequisites

1. **Frisbii Test Account**: You need a Frisbii test account with API credentials
2. **Organization Setup**: Each organization needs:
   - `paymentApiKey`: Frisbii API key (test mode)
   - `paymentWebhookSecret`: Secret for HMAC webhook verification
3. **Database**: Ensure all migrations are applied (`pnpm drizzle-kit migrate`)
4. **Environment**: API server running locally or in dev environment

## Test Scenarios

### 1. Create a Charge Session (Happy Path)

**Goal**: Successfully create a Frisbii checkout session for an enrollment

**Steps**:

1. Create a test organization with payment credentials:

   ```sql
   UPDATE organization
   SET
     payment_api_key = 'your_frisbii_test_api_key',
     payment_webhook_secret = 'your_webhook_secret'
   WHERE slug = 'test-org';
   ```

2. Create a program with a price:

   ```sql
   INSERT INTO program (organization_id, name, price, start_date, end_date, is_published)
   VALUES (1, 'Test Program', 50000, NOW(), NOW() + INTERVAL '30 days', true);
   -- price is in øre (50000 øre = 500 DKK)
   ```

3. Create a member and enrollment:

   ```sql
   INSERT INTO enrollment (program_id, member_id, status, payment_status)
   VALUES (1, 1, 'CONFIRMED', 'NONE');
   ```

4. Call the create charge session endpoint:
   ```bash
   curl -X POST http://localhost:8787/api/payments/session/charge \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -d '{
       "enrollmentId": 1,
       "currency": "DKK",
       "acceptPath": "/payment/success",
       "cancelPath": "/payment/cancel"
     }'
   ```

**Expected Response**:

```json
{
  "sessionId": "ses_...",
  "checkoutUrl": "https://checkout.frisbii.com/...",
  "paymentHandle": "member-1-..."
}
```

**Database Checks**:

- `payment` table should have a new record with status `PENDING`
- `enrollment.payment_status` should be updated to `PENDING`

---

### 2. Check Payment Status

**Goal**: Poll payment status after creating a session

**Steps**:

1. Use the `paymentHandle` from the previous step
2. Call the status endpoint:
   ```bash
   curl http://localhost:8787/api/payments/member-1-xxxx/status \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN"
   ```

**Expected Response**:

```json
{
  "handle": "member-1-...",
  "status": "PENDING",
  "enrollmentPaymentStatus": "PENDING",
  "amount": 50000,
  "currency": "DKK",
  "frisbiiRefs": {
    "sessionId": "ses_...",
    "chargeId": null,
    "invoiceHandle": null,
    "transactionId": null
  },
  "createdAt": "2025-11-03T...",
  "updatedAt": "2025-11-03T..."
}
```

---

### 3. Webhook - Invoice Settled

**Goal**: Process a successful payment webhook from Frisbii

**Webhook Payload Example**:

```json
{
  "id": "webhook-unique-id-123",
  "event_id": "evt_123",
  "event_type": "invoice_settled",
  "timestamp": "2025-11-03T12:00:00.000Z",
  "signature": "calculated_hmac_signature",
  "customer": "test-org-member-1",
  "invoice": "inv-123",
  "transaction": "txn_456"
}
```

**Calculate HMAC Signature** (for testing):

```javascript
const crypto = require('node:crypto');
const timestamp = "2025-11-03T12:00:00.000Z";
const webhookId = "webhook-unique-id-123";
const secret = "your_webhook_secret";

const signature = crypto
  .createHmac('sha256', secret)
  .update(timestamp + webhookId)
  .digest('hex');

console.log(signature);
```

**Steps**:

1. Send webhook to the org-specific endpoint:
   ```bash
   curl -X POST http://localhost:8787/api/webhooks/frisbii/test-org \
     -H "Content-Type: application/json" \
     -d '{
       "id": "webhook-unique-id-123",
       "event_id": "evt_123",
       "event_type": "invoice_settled",
       "timestamp": "2025-11-03T12:00:00.000Z",
       "signature": "YOUR_CALCULATED_SIGNATURE",
       "customer": "test-org-member-1",
       "invoice": "member-1-...",
       "transaction": "txn_456"
     }'
   ```

**Expected Response**:

```json
{
  "success": true,
  "message": "Processed"
}
```

**Database Checks**:

- `webhook_event` table should have the event recorded with `processed_at` timestamp
- `payment.status` should be updated to `SUCCEEDED`
- `payment.transaction_id` should be set to `"txn_456"`
- `enrollment.payment_status` should be updated to `PAID`

---

### 4. Webhook - Invoice Failed

**Goal**: Process a failed payment webhook

**Steps**:

1. Send webhook with `invoice_failed` event:
   ```bash
   curl -X POST http://localhost:8787/api/webhooks/frisbii/test-org \
     -H "Content-Type: application/json" \
     -d '{
       "id": "webhook-failed-123",
       "event_id": "evt_failed",
       "event_type": "invoice_failed",
       "timestamp": "2025-11-03T12:05:00.000Z",
       "signature": "YOUR_CALCULATED_SIGNATURE",
       "invoice": "member-2-..."
     }'
   ```

**Expected Response**:

```json
{
  "success": true,
  "message": "Processed"
}
```

**Database Checks**:

- `payment.status` should be `FAILED`
- `enrollment.payment_status` should be `FAILED`

---

### 5. Webhook Idempotency

**Goal**: Ensure duplicate webhooks are handled gracefully

**Steps**:

1. Send the same webhook twice (same `id` and signature)
2. Second request should return immediately without reprocessing

**Expected Response** (second call):

```json
{
  "success": true,
  "message": "Already processed"
}
```

**Database Checks**:

- Only one `webhook_event` record should exist for the given `webhook_id`
- Payment status should not change between calls

---

### 6. Webhook HMAC Verification Failure

**Goal**: Reject webhooks with invalid signatures

**Steps**:

1. Send webhook with incorrect signature:
   ```bash
   curl -X POST http://localhost:8787/api/webhooks/frisbii/test-org \
     -H "Content-Type: application/json" \
     -d '{
       "id": "webhook-invalid-sig",
       "event_id": "evt_invalid",
       "event_type": "invoice_settled",
       "timestamp": "2025-11-03T12:10:00.000Z",
       "signature": "invalid_signature_123",
       "invoice": "inv-123"
     }'
   ```

**Expected Response**:

```json
{
  "success": false,
  "message": "Invalid signature"
}
```

**HTTP Status**: `401 Unauthorized`

**Database Checks**:

- No `webhook_event` should be created
- No payment or enrollment updates

---

### 7. Organization Not Found

**Goal**: Handle webhooks for non-existent organizations

**Steps**:

1. Send webhook to invalid org slug:
   ```bash
   curl -X POST http://localhost:8787/api/webhooks/frisbii/nonexistent-org \
     -H "Content-Type: application/json" \
     -d '{...}'
   ```

**Expected Response**:

```json
{
  "success": false,
  "message": "Organization not found"
}
```

**HTTP Status**: `404 Not Found`

---

### 8. Missing Payment Credentials

**Goal**: Ensure proper error when org lacks payment setup

**Steps**:

1. Create an organization without `payment_api_key`
2. Try to create a charge session for an enrollment in that org

**Expected Response**:

```json
{
  "message": "Payment not configured for this organization"
}
```

**HTTP Status**: `400 Bad Request`

---

## Frisbii Test Cards

When testing in the Frisbii checkout UI, use these test cards:

- **Successful Payment**:
  - Card: `4111 1111 1111 1111`
  - Expiry: Any future date
  - CVV: Any 3 digits

- **Failed Payment**:
  - Card: `4000 0000 0000 0002`
  - Will trigger a `invoice_failed` webhook

Refer to [Frisbii Testing Documentation](https://docs.frisbii.com/docs/testing) for more test scenarios.

---

## Logs and Debugging

All payment operations are logged using `pino`. To view logs:

```bash
# Watch logs in real-time (if using pnpm dev)
pnpm dev

# Filter for payment-related logs
grep -i "payment\|frisbii\|webhook" logs.txt
```

**Key Log Events**:

- `"Creating charge session"` - When initiating payment
- `"Frisbii session created"` - After successful Frisbii API call
- `"Received Frisbii webhook"` - Webhook received
- `"Webhook processed successfully"` - Webhook handled
- `"Payment marked as succeeded"` - After successful payment

---

## Cleanup

After testing, clean up test data:

```sql
-- Remove test payments
DELETE FROM payment WHERE handle LIKE 'member-%-test%';

-- Remove test webhook events
DELETE FROM webhook_event WHERE event_id LIKE 'evt_test%';

-- Reset enrollment payment status
UPDATE enrollment SET payment_status = 'NONE' WHERE id IN (...);
```

---

## Production Checklist

Before deploying to production:

- [ ] All organizations have valid Frisbii API keys (production mode)
- [ ] Webhook secrets are properly configured
- [ ] Frisbii webhook URL is registered in Frisbii dashboard: `https://api.limaskap.fo/api/webhooks/frisbii/{orgSlug}`
- [ ] Webhook events `invoice_settled` and `invoice_failed` are enabled in Frisbii
- [ ] SSL/TLS certificates are valid for webhook endpoint
- [ ] Error alerting is configured for webhook failures
- [ ] Database backups are in place
- [ ] Monitoring is set up for payment metrics

---

## Support & Troubleshooting

**Common Issues**:

1. **"Invalid signature"** on webhook
   - Verify `payment_webhook_secret` matches Frisbii dashboard
   - Check timestamp format is ISO-8601
   - Ensure HMAC calculation uses `timestamp + id` (concatenated strings)

2. **"Payment not found"** in webhook handler
   - Verify `order.handle` in Frisbii session matches `payment.handle` in DB
   - Check if payment was created before webhook arrived
   - Look for typos in handle generation

3. **Checkout URL not loading**
   - Verify Frisbii API key is valid and in correct mode (test/production)
   - Check network logs for Frisbii API errors
   - Ensure `accept_url` and `cancel_url` are valid URLs

For further assistance, contact the development team or refer to:

- [Frisbii API Documentation](https://docs.frisbii.com/reference)
- [Frisbii Support](https://frisbii.com/support)
