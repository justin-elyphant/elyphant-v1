

# Fix Buy Now Drawer: Deduplicate Scheduling and Improve UX

## Problem
1. **Duplicate scheduling display**: After selecting a recipient and clicking "Schedule Gift", the scheduled date appears twice -- once in the scheduling modal area and again in the gift note section.
2. **"Schedule Gift" is buried** inside the recipient dropdown, making it easy to miss and creating a confusing flow.

## Solution
Move "Schedule Gift" out of the recipient dropdown and make it a **standalone collapsible step** (Step 3) in the Buy Now drawer, positioned between "Add a gift note" and "Pay with". This is not too much user fatigue -- it's a single optional tap, consistent with how gift note and payment work, and keeps the drawer clean and scannable.

### Updated Buy Now Drawer Flow
```text
+----------------------------------+
| [Product Image] Product Name     |
|              Ships from Elyphant |
+----------------------------------+
| Step 1: Who is this for?      >  |
|   - Myself                       |
|   - Justin Meeks (connection)    |
+----------------------------------+
| Step 2: Add a gift note       >  |
|   [textarea if expanded]         |
+----------------------------------+
| Step 3: Schedule delivery     >  |  <-- NEW standalone step
|   (only visible when recipient   |
|    is a connection)              |
|   [date picker if expanded]      |
+----------------------------------+
| Step 4: Pay with              >  |
|   Mastercard ....8673            |
+----------------------------------+
| Subtotal         $21.99          |
| Shipping          $6.99          |
| Gifting Fee       $3.20          |
| Total            $32.18          |
+----------------------------------+
| [  Place your order  ]           |
| Cancel                           |
+----------------------------------+
```

## Changes

### File: `src/components/marketplace/product-details/BuyNowDrawer.tsx`

1. **Remove** the "Schedule Gift" nudge/link from inside the recipient `CollapsibleContent` (lines 343-363).

2. **Add new state** for schedule delivery:
   - `scheduleOpen` (boolean) -- controls collapsible
   - `scheduledDate` (string) -- the selected date

3. **Add a new Collapsible step** (Step 3) between gift note and payment:
   - Icon: Calendar
   - Label: "Schedule delivery" (shows selected date when set)
   - Only rendered when `selectedRecipient?.type === 'connection'`
   - Contains an `<input type="date">` with the 8-day minimum lead time
   - "Set Date" / "Remove" buttons similar to the checkout page's `ScheduleDeliveryCard`

4. **Remove the `onOpenScheduleGift` prop** since scheduling is now handled inline (no need to close the drawer and open a separate modal).

5. **Pass `scheduledDate`** into the `create-checkout-session` metadata so the backend can handle deferred payment/fulfillment.

### File: `src/components/marketplace/product-details/ProductDetailsSidebar.tsx`
- Remove the `scheduleGiftData` state and `onOpenScheduleGift` callback that was passed to `BuyNowDrawer`, since scheduling is now self-contained in the drawer.
- Remove the `UnifiedGiftSchedulingModal` trigger that was connected to this flow (if it was only used for Buy Now).

