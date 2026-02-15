

## Enhance Buy Now Drawer: Gift Note + Open Address Discovery

### Overview
Two changes to the BuyNowDrawer to improve the gifting experience without disrupting the fast-checkout flow.

### Change 1: Gift Note Section
Add an optional "Add a gift note" toggle between the address picker and payment picker. When tapped, it expands to reveal a textarea (max 240 chars to fit Zinc gift message limits). The note gets passed through to `create-checkout-session` metadata so it can be printed on the Amazon gift receipt.

- Collapsed by default: just a subtle row with a Gift icon and "Add a gift note" text
- Expanding reveals a textarea with character counter
- The gift note is included in the checkout session metadata as `gift_message`
- When a connection is selected as recipient, the note toggle auto-expands as a nudge

### Change 2: Address Picker Starts Open (No Pre-Selection)
Instead of pre-selecting "Ship to Myself" and collapsing the picker, the drawer will:

- Start with `addressPickerOpen = true` (expanded)
- Start with `selectedRecipient = null` (nothing pre-checked)
- Show a brief prompt: "Who is this for?" above the options
- The "Place your order" button stays disabled until a recipient is explicitly chosen
- Once selected, the picker collapses as it does today

This creates a natural decision point without adding friction -- users must make one tap to choose themselves or a connection, which surfaces the gifting option organically.

### What Stays the Same
- Payment picker behavior unchanged
- Total pricing display unchanged
- Schedule Gift nudge still appears when a connection is selected
- All existing connection filtering logic (top 3, verified addresses)
- Desktop flow unchanged (desktop uses full /checkout page, not the drawer)

### Technical Details

**File: `src/components/marketplace/product-details/BuyNowDrawer.tsx`**

1. Add `giftNote` state (`useState("")`) and `giftNoteOpen` state
2. Change `addressPickerOpen` default from `false` to `true`
3. Remove the auto-selection of self -- keep `selectedRecipient` as `null` initially
4. Add a "Who is this for?" label above the address options when nothing is selected
5. Insert a new Collapsible section between address and payment for the gift note
6. Update `hasRequiredData` to also require `selectedRecipient !== null`
7. Pass `gift_message: giftNote` in the checkout session metadata body
8. Auto-expand gift note when a connection is selected

