

# Plan: Fix Order Monitor Using Wrong Zinc Identifier

## Problem Summary

The `order-monitor-v2` edge function incorrectly uses `zinc_order_id` (Amazon's merchant order ID like `113-7307475-6287460`) when querying Zinc's API, but Zinc expects `zinc_request_id` (the actual Zinc request ID like `4421915eeffeacacd596eea63c2ac85a`).

This caused your order to be incorrectly marked as `failed` with the error "The provided request_id is invalid."

## Root Cause

Line 66 in `supabase/functions/order-monitor-v2/index.ts`:
```javascript
const zincIdentifier = order.zinc_order_id || order.zinc_request_id;
```

This prioritizes the wrong field. The Zinc API endpoint `/v1/orders/{id}` expects the request_id, not the merchant order ID.

## Solution

Change the identifier logic to always use `zinc_request_id` for API queries:

```javascript
// Always use zinc_request_id for Zinc API queries (not zinc_order_id which is Amazon's ID)
const zincIdentifier = order.zinc_request_id;
const isWebhookTimeout = !order.zinc_order_id && order.zinc_request_id;
```

## Implementation Details

### File Changes

**supabase/functions/order-monitor-v2/index.ts**

1. **Fix identifier selection (line 66-67)**: Use `zinc_request_id` exclusively for API calls
2. **Skip orders without zinc_request_id**: If no request_id exists, skip the order
3. **Maintain webhook timeout detection**: Still track whether zinc_order_id was populated via webhook or polling

### Code Changes

```javascript
// Before (incorrect)
const zincIdentifier = order.zinc_order_id || order.zinc_request_id;
const isWebhookTimeout = !order.zinc_order_id && order.zinc_request_id;

// After (correct)
// Zinc API requires the request_id, not the Amazon merchant order ID
if (!order.zinc_request_id) {
  console.log(`⏭️ Skipping order ${order.id} - no zinc_request_id available`);
  continue;
}
const zincIdentifier = order.zinc_request_id;
const isWebhookTimeout = !order.zinc_order_id;
```

## Data Recovery

After deployment, restore the incorrectly-failed order:

```sql
UPDATE orders 
SET status = 'processing',
    notes = NULL
WHERE id = 'db697d76-dd5e-4ab0-9389-b91996b60ee9';
```

## Verification Steps

1. Deploy the updated edge function
2. Run the SQL to restore order status
3. Manually trigger order-monitor-v2
4. Verify order updates to `shipped` status with correct data from Zinc

## Technical Notes

| Field | Purpose | Example |
|-------|---------|---------|
| `zinc_request_id` | Zinc's internal request ID - used for API queries | `4421915eeffeacacd596eea63c2ac85a` |
| `zinc_order_id` | Amazon's merchant order ID - for customer reference | `113-7307475-6287460` |

The naming is a bit confusing since `zinc_order_id` sounds like it should be used with Zinc, but it's actually the downstream merchant's order ID that Zinc populates after successful placement.

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/order-monitor-v2/index.ts` | Fix identifier selection to use `zinc_request_id` |

