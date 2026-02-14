

## Fix: Zinc Webhook Error Handling and Auto-Retry

### Problem 1: Wrong Error Field Extraction

Zinc puts error info at the payload root, not nested under `.error`:

| Field | Webhook looks at | Zinc actually sends |
|---|---|---|
| Error code | `payload.error.code` (undefined) | `payload.code` ("internal_error") |
| Error message | `payload.error.message` (undefined) | `payload.message` ("Zinc or the retailer...") |
| Error data | `payload.error.data` (undefined) | `payload.data` (product details) |

**Fix**: Update `handleRequestFailed` to read from root-level fields first, falling back to the nested `.error` object:

```typescript
const errorCode = payload.code || payload.error?.code || 'unknown';
const errorMessage = payload.message || payload.error?.message || 'Unknown Zinc error';
const errorData = payload.data || payload.error?.data;
```

### Problem 2: No Auto-Retry for Retryable Errors

The shared `zmaErrorClassification.ts` already classifies `internal_error` as retryable (2-hour delay, 2 max retries). But `handleRequestFailed` ignores this entirely -- it marks every error as `failed` and emails the customer immediately.

**Fix**: Before marking an order as permanently failed, classify the error. If it's retryable:
- Set status to `requires_attention` (not `failed`) so the order stays visible for retry
- Schedule an automatic retry by invoking `process-order-v2` after the configured delay
- Do NOT send a failure email to the customer (it's premature)
- Track retry count in notes to respect the max retry limit

If max retries are exhausted, THEN mark as `failed` and send the customer email.

### What Changes

**File: `supabase/functions/zinc-webhook/index.ts`**

1. Add import for `classifyZmaError` from shared utility
2. Update `handleRequestFailed` to:
   - Extract error code/message from root-level fields (not `payload.error`)
   - Call `classifyZmaError` to determine if the error is retryable
   - Track `retry_count` in notes
   - If retryable and under max retries: set status to `requires_attention`, skip customer email, log that auto-retry is pending
   - If NOT retryable or max retries exceeded: set status to `failed`, send customer failure email (existing behavior)

### Technical Details

```text
Error flow BEFORE fix:
  Zinc sends internal_error --> webhook marks order "failed" --> customer gets failure email
  (Even though error is temporary and retryable)

Error flow AFTER fix:
  Zinc sends internal_error --> webhook classifies error --> retryable?
    YES (retry count < max) --> status = "requires_attention", no customer email, log for admin
    NO (or max retries hit) --> status = "failed", send customer failure email
```

### Immediate Action for Order #7371

After deploying the fix, manually retry this order from Trunkline since the webhook already fired. The `internal_error` was about Amazon not being able to add the product quantity to cart -- this is typically a transient issue that resolves on retry.

### Interface Updates Needed

The `ZincWebhookPayload` interface needs two new optional root-level fields:
- `code?: string` -- Zinc error code at root level
- `message?: string` -- Zinc error message at root level
- `data?: any` -- Zinc error data at root level

These already exist in the Zinc payload but aren't in our TypeScript interface.
