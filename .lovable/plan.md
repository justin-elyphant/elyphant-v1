

# Add "Schedule Gift" Nudge in Buy Now Drawer

## What Changes

When a user selects a connection as the shipping recipient, a subtle contextual nudge appears below the address picker suggesting they can schedule the delivery instead. Tapping it closes the drawer and opens the Schedule Gift modal.

## How It Works

1. User selects a connection in the "Ship to" picker
2. A small text link appears: "Want to schedule delivery? Use Schedule Gift"
3. Tapping the link closes the drawer and opens the existing Schedule Gift modal
4. If "Ship to Myself" is selected (or no connection chosen), the nudge is hidden

## Technical Details

### File: `BuyNowDrawer.tsx`

1. **New prop**: Add `onOpenScheduleGift?: () => void` callback to `BuyNowDrawerProps`
2. **Conditional nudge**: After the address picker `Collapsible` closing tag (line ~347), render a text nudge only when `selectedRecipient?.type === 'connection'` and `onOpenScheduleGift` is provided
3. **Handler**: On click, call `onOpenChange(false)` to close the drawer, then call `onOpenScheduleGift()`

### File: `ProductDetailsSidebar.tsx`

1. **Pass callback**: Add `onOpenScheduleGift={() => setShowScheduleGiftModal(true)}` prop to the `BuyNowDrawer` component where it is rendered

### UI

The nudge is a single line of small muted text with an underlined link, placed between the address picker and the payment picker -- minimal footprint, no visual competition with the red "Place your order" button.

```text
Ship to
  Sarah, Denver, CO                [v]
  Want to schedule delivery? Use Schedule Gift →
Pay with
  Visa ····4242                    [>]
```
