

## Fix Order Status Display for Awaiting-Funds Orders

### Problem

The order detail page shows "Processing" for orders that are actually in `awaiting_funds` status. This is misleading — the order hasn't been submitted to Zinc yet. The stepper UI should reflect that the order is waiting to be fulfilled, not actively processing.

### Investigation Needed

I need to check how the order detail page maps status values to display labels and stepper states.

### Proposed Changes

**1. Order Detail Status Mapping**

Find the order detail component and ensure `awaiting_funds` is mapped to a distinct, user-friendly label like "Order Received" or "Confirmed" — not "Processing" (which implies Zinc submission has occurred).

**2. Stepper Accuracy**

The 4-step stepper (Order Placed → Processing → Shipped → Delivered) should only advance to "Processing" when `status` is `processing` or `submitted_to_zinc`. For `awaiting_funds`, it should stay on step 1 ("Order Placed").

### No Backend Changes

The Stripe → webhook → process-order-v2 → Zinc pipeline is correctly wired. The ZMA balance check is working as designed. This is a **display-only** fix.

### Files to Investigate/Change

- Order detail page component (likely `src/components/orders/OrderDetail.tsx` or similar)
- Status mapping utility if one exists

### Technical Details

Current status flow:
```text
paid → awaiting_funds (ZMA insufficient) → processing (ZMA funded) → submitted_to_zinc → completed
```

The UI currently collapses `awaiting_funds` and `processing` into the same visual state. They should be distinct:
- `awaiting_funds` = Step 1 complete (Order Placed), Step 2 pending
- `processing` / `submitted_to_zinc` = Step 2 active (Processing)
- `shipped` = Step 3 active
- `delivered` / `completed` = Step 4 active

