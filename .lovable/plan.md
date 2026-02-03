
# Plan: Fix Order Monitor Misinterpreting "request_processing" as Failure

## Issue Summary

The `order-monitor-v2` edge function is incorrectly marking orders as `failed` when Zinc returns a `request_processing` status. This is a critical bug because `request_processing` means **the order is still being worked on** - it's NOT a failure.

### Evidence from Logs:
```
❌ Order db697d76-dd5e-4ab0-9389-b91996b60ee9 failed in Zinc: 
   Request is currently processing and will complete soon.
```

## Root Cause

In `supabase/functions/order-monitor-v2/index.ts` at lines 124-125:

```javascript
const isFailed = zincData.code === 'failed' || 
                 zincData.code === 'cancelled' ||
                 zincData._type === 'error';  // ← Too broad!
```

The check `zincData._type === 'error'` catches ALL error types, but Zinc uses `_type: 'error'` for both:
- **Actual failures**: `code: 'failed'`, `code: 'out_of_stock'`, etc.
- **In-progress states**: `code: 'request_processing'` (not a failure!)

## Solution

Update the failure detection logic to explicitly exclude `request_processing`:

```javascript
// Check for failed status - but NOT request_processing (still in progress)
const isFailed = zincData.code === 'failed' || 
                 zincData.code === 'cancelled' ||
                 (zincData._type === 'error' && zincData.code !== 'request_processing');
```

Additionally, add explicit handling for `request_processing` to log it as "still in progress" instead of silently falling through:

```javascript
// Handle request_processing explicitly - NOT a failure
if (zincData._type === 'error' && zincData.code === 'request_processing') {
  console.log(`⏳ Order ${order.id} still processing in Zinc (request_processing state)`);
  continue;  // Skip to next order, no status update needed
}
```

## Implementation

### File: `supabase/functions/order-monitor-v2/index.ts`

**Change 1: Add explicit request_processing handling (after line 97)**

Insert a check to recognize `request_processing` as a valid in-progress state:

```javascript
// Handle request_processing - this means Zinc is actively working on it
if (zincData._type === 'error' && zincData.code === 'request_processing') {
  console.log(`⏳ Order ${order.id} still processing in Zinc queue (request_processing)`);
  continue; // Don't mark as failed, just wait for next poll
}
```

**Change 2: Update isFailed condition (lines 124-125)**

Make the failure detection more precise:

```javascript
// Check for actual failed status - exclude request_processing
const isFailed = zincData.code === 'failed' || 
                 zincData.code === 'cancelled' ||
                 zincData.code === 'out_of_stock' ||
                 zincData.code === 'payment_failed' ||
                 (zincData._type === 'error' && 
                  zincData.code !== 'request_processing' &&
                  zincData.code !== 'pending');
```

## Data Fix

After deploying the fix, we need to restore the incorrectly-marked order:

```sql
UPDATE orders 
SET status = 'processing',
    notes = NULL
WHERE id = 'db697d76-dd5e-4ab0-9389-b91996b60ee9';
```

## Test Verification

After deployment:
1. Re-run the scheduler/monitor
2. Verify the order stays in `processing` status (not `failed`)
3. Wait for Zinc webhook OR next monitor poll to update to `shipped`

## Technical Notes

| Zinc `_type` | Zinc `code` | Meaning | Our Action |
|--------------|-------------|---------|------------|
| `error` | `request_processing` | Order in Zinc queue, actively processing | Keep polling, stay `processing` |
| `error` | `failed` | Order failed | Mark as `failed` |
| `error` | `out_of_stock` | Product unavailable | Mark as `failed` |
| `order_response` | - | Order completed successfully | Update to `shipped` |

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/order-monitor-v2/index.ts` | Add `request_processing` handling, refine `isFailed` logic |

## Deployment

1. Update the edge function code
2. Deploy `order-monitor-v2`
3. Run SQL to fix the incorrectly-marked order
4. Verify by checking order status in database
