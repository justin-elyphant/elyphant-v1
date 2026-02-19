

# Simplify Cart "Unassigned Items" for One-Off Shoppers

## Problem

The current cart shows an orange warning card titled "Unassigned Items" with the message "These items need recipient assignment." For a shopper who just wants to buy something for themselves, this is confusing -- standard e-commerce carts don't require you to "assign" items before checkout. The language and visual treatment (orange warning, alert icon) creates unnecessary friction.

## Solution: Reframe as "Shipping To" with Smart Defaults

Replace the warning-style "Unassigned Items" card with a clean, non-alarming delivery section inspired by standard e-commerce patterns and the existing Buy Now drawer's step layout.

### Key Design Changes

1. **Remove the orange warning aesthetic** -- no AlertTriangle, no "needs assignment" language
2. **Default assumption: shipping to yourself** -- this is what 90%+ of e-commerce shoppers expect
3. **Show a clean "Delivering to" summary** with the user's address (if available) or a prompt to add one
4. **Keep "Send as Gift" as an optional action** -- not the default flow
5. **For guests**: skip the section entirely (they enter shipping at checkout, which is standard)

### Visual Design (Lululemon-inspired, monochromatic)

```
+-------------------------------------------------------+
|  Delivering to                                         |
|                                                        |
|  [User icon]  Justin Meeks                             |
|               123 Main St, Dallas, TX 75001            |
|               [Edit]                                   |
|                                                        |
|  ---- or ----                                          |
|                                                        |
|  [Gift icon]  Send as a gift instead                   |
+-------------------------------------------------------+
```

If the user has no address saved:
```
+-------------------------------------------------------+
|  Delivering to                                         |
|                                                        |
|  Shipping address will be collected at checkout        |
|                                                        |
|  [Gift icon]  Send as a gift instead                   |
+-------------------------------------------------------+
```

### Technical Changes

**File: `src/components/cart/UnassignedItemsSection.tsx`** (full rewrite)

- Remove orange Card/Alert/AlertTriangle/Badge styling
- Replace with a clean white card, grey border (monochromatic)
- Header: "Delivering to" (not "Unassigned Items")
- If user has address: show name + address summary with "Edit" link to settings
- If no address: show neutral text "Shipping address collected at checkout"
- Replace "Assign to Recipient" button with subtle "Send as a gift instead" link/button with Gift icon
- Remove "Ship to Me" button (it's now the default, no action needed)
- For guest users (no profile): show only the "collected at checkout" message
- Keep the item list but make it less prominent (or remove it since items are already shown below in the main cart list)

**File: `src/pages/Cart.tsx`** (minor update, lines 349-356)

- Remove the `onAssignToMe` handler call since self-shipping is now the default
- The "Send as a gift" action still triggers the existing `onAssignAll` / recipient modal flow
- For guests, hide the section entirely (they enter shipping at checkout)

### Props Changes

```typescript
interface UnassignedItemsSectionProps {
  unassignedItems: CartItem[];
  onSendAsGift: () => void;     // renamed from onAssignAll
  userName?: string;
  userAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
  isGuest: boolean;
}
```

### What Stays the Same

- The recipient assignment modal (triggered by "Send as a gift") is unchanged
- Delivery groups / package previews remain as-is
- The checkout flow and address validation logic are unchanged
- The wishlist purchase indicator (coral-orange banner) is unchanged

### E-Commerce Standards Applied

- Default to self-shipping (Amazon, Target, Lululemon all do this)
- Gift option is secondary, not primary
- No warnings for normal shopping behavior
- Address shown if available, collected at checkout if not

