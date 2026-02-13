

## Fix Two Trunkline Order Recovery Issues

### Issue 1: Manual Recovery "Order not found"

**Root Cause:** In `src/components/admin/OrderRecoveryTool.tsx` line 84, the query uses:
```
.or(`id.eq.${manualOrderId},order_number.eq.${manualOrderId}`)
```
When entering `ORD-20260213-6387`, PostgREST tries to cast it to UUID for `id.eq.` and the entire query fails -- so `fetchError` is truthy and the toast shows "Order not found."

**Fix:** Detect if input is a UUID. If not, query only by `order_number`:
```typescript
const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(manualOrderId.trim());

let query = supabase
  .from('orders')
  .select('id, order_number, status, zinc_order_id, payment_status, scheduled_delivery_date')

if (isUuid) {
  query = query.or(`id.eq.${manualOrderId.trim()},order_number.eq.${manualOrderId.trim()}`);
} else {
  query = query.eq('order_number', manualOrderId.trim());
}

const { data: order, error: fetchError } = await query.maybeSingle();
```

**File:** `src/components/admin/OrderRecoveryTool.tsx` (lines 81-85)

---

### Issue 2: Retry Button Not Reaching Zinc

**Root Cause:** In `src/components/trunkline/orders/OrdersTable.tsx` line 93, the retry uses `supabase.functions.invoke` directly. Edge function logs show no call arrived, suggesting the invocation failed silently (possibly auth/token issue). The error handling on line 97 only checks `if (error) throw error` but `supabase.functions.invoke` can return errors in ways that don't always throw.

**Fix:** Replace the direct `supabase.functions.invoke` with `invokeWithAuthRetry` (already exists at `src/utils/supabaseWithAuthRetry.ts`), which handles token refresh on 401s. Also improve error logging to surface what's actually happening:

```typescript
import { invokeWithAuthRetry } from '@/utils/supabaseWithAuthRetry';

// In handleRetryOrder:
const { data, error } = await invokeWithAuthRetry('process-order-v2', {
  body: { orderId: order.id }
});

if (error) {
  console.error('Retry error details:', error);
  throw error;
}

console.log('Retry response:', data);
```

**File:** `src/components/trunkline/orders/OrdersTable.tsx` (lines 88-108)

---

### Summary of Changes

| File | Change |
|---|---|
| `src/components/admin/OrderRecoveryTool.tsx` | UUID-detect before querying to prevent PostgREST cast error |
| `src/components/trunkline/orders/OrdersTable.tsx` | Use `invokeWithAuthRetry` for retry + better error logging |

After these fixes, both the Manual Recovery input and the Retry button will work for Order #6387.

