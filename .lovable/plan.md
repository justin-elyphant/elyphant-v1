

## Fix: zinc-webhook Can't Parse Zinc's Payload Format

### What's Happening

When Zinc calls our webhook after completing an order, it sends the event type in a field called `_type` (with an underscore). Our webhook code looks for `type` (without underscore), so it sees `undefined` and skips all processing. This means:

- The Amazon order ID (`112-4824932-0694615`) never gets saved
- The tracking URL never gets saved
- The order stays stuck as "processing" in Trunkline forever
- The webhook log entry fails because `event_type` is null (database requires it)

### What's Changing

**File: `supabase/functions/zinc-webhook/index.ts`**

1. **Detect event type from `_type` field** -- Zinc uses `_type: "order_response"` for success and `_type: "error"` for failures. Add a mapping function at the top:

```typescript
function resolveEventType(payload: any): string {
  // Zinc sends _type, not type
  if (payload.type) return payload.type;
  
  if (payload._type === 'order_response') return 'request_succeeded';
  if (payload._type === 'error') return 'request_failed';
  if (payload.tracking) return 'tracking_obtained';
  
  return payload._type || 'unknown';
}
```

2. **Use resolved event type everywhere** -- Replace all `payload.type` references with the resolved value so the switch statement, logging, and idempotency checks all work correctly.

3. **Extract merchant order data from Zinc's nested structure** -- In `handleRequestSucceeded`, Zinc sends the Amazon order ID inside `merchant_order_ids[0].merchant_order_id` and the tracking URL in `merchant_order_ids[0].tracking_url`. Update the handler to extract these:

```typescript
// Extract from Zinc's nested structure
const merchantInfo = payload.merchant_order_ids?.[0];
const merchantOrderId = merchantInfo?.merchant_order_id 
  || payload.merchant_order_id 
  || payload.order_id;
const trackingUrl = merchantInfo?.tracking_url;
const deliveryDates = payload.delivery_dates;
```

4. **Save delivery estimate** -- The Zinc response includes `delivery_dates[0].date: "2026-02-16"`. Save this to the order's `estimated_delivery` field.

### Technical Summary

| Line Area | Current | Fixed |
|---|---|---|
| Event type detection | `payload.type` (undefined) | `resolveEventType(payload)` maps `_type` |
| Merchant order ID | `payload.merchant_order_id` (undefined) | `payload.merchant_order_ids[0].merchant_order_id` |
| Tracking URL | Not captured on success | Saved from `merchant_order_ids[0].tracking_url` |
| Delivery estimate | Not captured | Saved from `delivery_dates[0].date` |
| Webhook log | Fails (null event_type) | Uses resolved type, falls back to "unknown" |

### After Deployment

- The webhook will correctly process Zinc's success/failure callbacks going forward
- For Order #6387 specifically, we'll manually update the database with the Amazon order data since the webhook already fired and won't re-fire

