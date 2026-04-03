

## Restructure Zinc Status Pipeline + Cleanup

### What's broken (recap)

1. **`zinc-webhook` line 522**: `handleTrackingUpdate` checks `payload.tracking` as a single object — Zinc sends `tracking[]` array at root level. Result: tracking/delivery webhooks silently ignored.
2. **`order-monitor-v2` line 204**: Checks `zincData.code === 'delivered'` — Zinc never sends this. Delivery status lives in `tracking[].delivery_status`. Result: orders never transition to delivered.
3. **`order-monitor-v2` line 157**: Sets `status: 'shipped'` for ANY successful `order_response`, even already-delivered orders. Result: can downgrade delivered → shipped.
4. **`order-monitor-v2` line 151-153**: Builds notes via string concatenation (`notes + " | Tracking: ..."`) — but `notes` is a JSONB column everywhere else. Result: corrupts JSONB field.
5. **`order-monitor-v2`**: Only queries `status = 'processing'` orders — never polls `shipped` orders to detect delivery.

### Cleanup opportunities (rolled in)

| Issue | Location | Cleanup |
|-------|----------|---------|
| Notes string concat corrupts JSONB | monitor line 151-164 | Use proper JSONB merge |
| `handleCaseUpdate` overwrites notes instead of merging | webhook line 625-633, 641-648 | Merge with existing notes |
| `handleCancellationWebhook` overwrites notes | webhook line 804-808 | Merge with existing notes |
| Redundant `handleStatusUpdate` dead code | webhook line 585-609 | Zinc rarely sends `status_updated` with a top-level `.status` — but keep it, just add tracking array check |
| Monitor doesn't prevent status downgrade | monitor line 157 | Add guard: never go from delivered/completed → shipped |
| `resolveEventType` doesn't detect tracking array | webhook line 83 | Check for root-level `tracking[]` array too |

### Changes (2 edge functions + 1 SQL fix)

**File 1: `supabase/functions/zinc-webhook/index.ts`**

A. **Update interface** — Add `tracking` as union type supporting both single object and array with `delivery_status`, `delivery_proof_image`, `retailer_tracking_number`, `merchant_order_id` fields.

B. **Add `resolveTrackingData()` helper** — Normalizes tracking input: array → use first entry with richest data; single object → wrap; missing → null. Extracts `delivery_status`, `delivery_proof_image`, `tracking_number`, `tracking_url`.

C. **Rewrite `handleTrackingUpdate()`:**
- Call `resolveTrackingData(payload)` 
- If `delivery_status === 'Delivered'` → set status `delivered`, set `fulfilled_at`, store `delivery_proof_image` in notes (JSONB merge)
- Otherwise → set status `shipped`, store tracking number + URL
- Queue correct email: `order_delivered` vs `order_shipped`

D. **Fix `handleStatusUpdate()`** — Also check root-level `tracking[]` for delivery status as fallback.

E. **Fix `handleCaseUpdate()` and `handleCancellationWebhook()`** — Merge notes with existing instead of overwriting (fetch existing notes first, spread).

F. **Update `resolveEventType()`** — Add detection for root-level `tracking` array: `if (Array.isArray(payload.tracking)) return 'tracking_updated'`.

**File 2: `supabase/functions/order-monitor-v2/index.ts`**

A. **Add `shipped` orders to polling queries** — New query for `status = 'shipped'` orders to detect delivery transitions.

B. **Fix delivery detection** — Replace `zincData.code === 'delivered'` with:
```
const isDelivered = zincData.tracking?.some(t => t.delivery_status?.toLowerCase() === 'delivered');
```

C. **Add status downgrade guard** — Before applying updates, check: if current status is `delivered` or `completed`, skip any update that would set a "lower" status.

D. **Fix notes to JSONB** — Replace string concatenation with proper object merge:
```
updates.notes = { ...(order.notes || {}), tracking_url: trackingUrl, recovered_via: 'polling' };
```

E. **Store delivery proof** — When delivered, capture `delivery_proof_image` from tracking entry into notes.

**File 3: SQL data fix** — Update order `92cefb3b-3328-449a-b960-7cec30b82860` to `delivered` status with `fulfilled_at` and tracking info from the Zinc JSON.

### Result

- **Delivery detection works** via both webhook and polling fallback
- **No more JSONB corruption** from string concatenation
- **No status downgrades** (delivered never goes back to shipped)
- **Shipped orders get polled** for delivery transitions
- **Notes consistently merged** across all handlers (6 locations fixed)

