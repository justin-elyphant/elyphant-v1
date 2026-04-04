

## Cleanup: Remove Dead Components + Extract Shared Order Status Logic

### Dead components to delete (safe — zero imports)

These files are not imported anywhere in the codebase:

1. **`src/components/orders/OrderStatusChecker.tsx`** — Hardcoded debug tool with a specific Zinc order ID baked in. Replaced by `order-monitor-v2` polling.
2. **`src/components/orders/OrderMonitoring.tsx`** — Admin monitoring card that calls legacy `check-zinc-order-status`. Not mounted in any page/route.
3. **`src/components/orders/OrdersTable.tsx`** — Unused duplicate. `OrderTable.tsx` is the one actually imported by `Orders.tsx`.
4. **`src/components/orders/OrderItemsTable.tsx`** — Superseded by `EnhancedOrderItemsTable.tsx` (the one `OrderDetail.tsx` imports).

### Duplicated logic to consolidate

Three components independently compute "order status → step progression":
- `OrderProgressStepper` (horizontal stepper at page top)
- `TrackingInfoCard` (progress bar + tracking details in sidebar)
- `OrderTimeline` (vertical timeline in sidebar)

All three build the same 4-step pipeline (Ordered → Processing → Shipped → Delivered), map `zincTimelineEvents` to timestamps, and resolve step statuses. This is ~120 lines of duplicated logic.

**Extract a shared utility:**

**New file: `src/utils/orderTrackingUtils.ts`**
- `resolveCarrierName(order)` — carrier detection from tracking prefix / notes (currently only in TrackingInfoCard)
- `getExternalTrackingUrl(order)` — carrier-specific URL builder (currently only in TrackingInfoCard)
- `computeOrderSteps(status, zincTimelineEvents, orderDate, fulfilledAt)` — returns step array with statuses and timestamps. Replaces `buildSteps()` in TrackingInfoCard, `getStepStatus()` in OrderProgressStepper, and `synthesizeTimelineFromStatus()` + `getTimelineEvents()` in OrderTimeline.

**Then simplify:**

- **`TrackingInfoCard`** — imports from shared util, removes ~50 lines of inline logic
- **`OrderProgressStepper`** — imports `computeOrderSteps`, removes its own 60-line `getStepStatus` + `statusProgressMap`
- **`OrderTimeline`** — imports `computeOrderSteps`, removes `synthesizeTimelineFromStatus` (50 lines) and the 4-priority fallback chain. Keeps its vertical timeline rendering but sources data from the shared function.

### Style fix (while we're here)

`OrderProgressStepper` uses purple-to-blue gradients (`from-purple-600 to-sky-500`) for active steps — this violates the monochromatic + red accent design system. Change active indicator to use `bg-destructive` (red) consistent with `TrackingInfoCard`.

### Summary of changes

| Action | File | Lines saved |
|--------|------|------------|
| Delete | `OrderStatusChecker.tsx` | 147 |
| Delete | `OrderMonitoring.tsx` | 374 |
| Delete | `OrdersTable.tsx` | 129 |
| Delete | `OrderItemsTable.tsx` | 87 |
| Create | `orderTrackingUtils.ts` | +60 |
| Simplify | `TrackingInfoCard.tsx` | -50 |
| Simplify | `OrderProgressStepper.tsx` | -60 |
| Simplify | `OrderTimeline.tsx` | -80 |
| **Net** | | **~860 lines removed** |

### Technical details

The shared `computeOrderSteps` function signature:

```text
computeOrderSteps(
  status: string,
  zincTimelineEvents: ZincTimelineEvent[],
  orderDate: string,
  fulfilledAt?: string
) => OrderStep[]

OrderStep = {
  id: string,
  label: string,
  status: 'completed' | 'active' | 'upcoming',
  timestamp?: string
}
```

Each consumer maps `OrderStep[]` to its own visual representation (horizontal stepper, progress bar, vertical timeline) — no UI coupling in the shared layer.

