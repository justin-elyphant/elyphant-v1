

# Fix: Reduce Overly Aggressive ZMA Balance Thresholds

## Problem
A Buy Now order was blocked with "awaiting_funds" even though the ZMA balance ($78) had plenty to cover the purchase. The current formula requires far too much headroom:

```
required = (order_total * 1.30) + $50
```

For a ~$25 order, that's $82.50 required — more than your $78 balance. For small orders, the $50 flat margin dominates and is unreasonable.

## Fix

In `supabase/functions/process-order-v2/index.ts`, reduce the safety thresholds:

- **Buffer**: 30% down to 15% (Zinc markup rarely exceeds 10%)
- **Safety margin**: $50 down to $10

New formula: `required = (order_total * 1.15) + $10`

For a $25 order: `($25 * 1.15) + $10 = $38.75` — easily covered by $78.

### File: `supabase/functions/process-order-v2/index.ts` (lines 418-419)

Change:
```typescript
const estimatedCost = order.total_amount * 1.30; // 30% buffer
const ZMA_SAFETY_MARGIN = 50;
```

To:
```typescript
const estimatedCost = order.total_amount * 1.15; // 15% buffer for Zinc markup
const ZMA_SAFETY_MARGIN = 10; // $10 safety margin
```

No other files need changes. After this, retry the stuck order from Trunkline's Order Recovery Tool.
