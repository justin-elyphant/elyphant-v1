

# Checkout Page Cleanup: Modern E-Commerce UX

## Problems Identified

Looking at the screenshots and code, there are several issues on the `/checkout` page:

1. **Redundant Gift Message section** — There's a standalone "Gift Message" card below shipping that duplicates the gift message already displayed inside the green shipping review card. If the user already set a message during scheduling (shown in the green card as `"Scheduled gift test"`), the empty textarea below is confusing. The shipping review card already has inline edit capability via `QuickEditModal`.

2. **Green SaaS aesthetic** — Delivery group cards use `bg-green-50`, `border-green-200`, `text-green-600/700/800` with green badges and green text everywhere. This reads as a SaaS dashboard status indicator, not a Lululemon-inspired e-commerce checkout.

3. **Purple-to-blue gradient** — The progress indicator and Pay Now button use `bg-gradient-to-r from-purple-600 to-sky-500`, which violates the monochromatic + red accent design system.

4. **Blue self-shipping card** — "Your Address" section uses `bg-blue-50`, `border-blue-200` — another color that doesn't belong.

## Changes

### 1. Remove redundant Gift Message card from checkout form
**File:** `src/components/checkout/UnifiedCheckoutForm.tsx` (lines 791-815)

Remove the standalone Gift Message `<Card>` section. The gift message is already editable inline within `CheckoutShippingReview` via the `QuickEditModal` component. If no message exists, there's already an "Add gift message" button in the shipping review card. This eliminates the confusing empty textarea.

### 2. Restyle shipping review cards — monochromatic theme
**File:** `src/components/checkout/CheckoutShippingReview.tsx`

Replace the green/blue color scheme with the Lululemon-inspired monochromatic palette:
- **Recipient cards**: `bg-green-50` → `bg-gray-50`, `border-green-200` → `border-gray-200`, `text-green-600/700/800` → `text-gray-600/700/800`, green badges → neutral badges
- **Self-shipping card**: `bg-blue-50` → `bg-gray-50`, `border-blue-200` → `border-gray-200`, blue text → neutral text
- **Gift message/scheduled delivery sub-cards**: White background with `border-gray-200` instead of green borders
- **"Scheduled Delivery" and "Gift Message" labels**: Use subtle text styling instead of colored text

### 3. Restyle progress indicator — monochromatic + red accent
**File:** `src/components/checkout/CheckoutProgressIndicator.tsx`

- Active step circle: `border-purple-600 text-purple-600` → `border-black text-black`
- Completed step: `bg-gradient-to-r from-purple-600 to-sky-500` → `bg-black text-white`
- Connecting line completed: gradient → `bg-black`
- Connecting line pending: stays muted

### 4. Restyle Pay Now sticky button — red accent CTA
**File:** `src/components/checkout/UnifiedCheckoutForm.tsx` (line 925)

- Replace `bg-gradient-to-r from-purple-600 to-sky-500` with `bg-red-600 hover:bg-red-700` (matches the single-accent-color rule from the design system)

### 5. Restyle Stripe redirect overlay
**File:** `src/components/checkout/UnifiedCheckoutForm.tsx` (line 649)

- Animated shimmer bar: Replace purple gradient with neutral/black shimmer

## Files Changed
1. `src/components/checkout/UnifiedCheckoutForm.tsx` — remove redundant gift message card, restyle Pay Now button and redirect overlay
2. `src/components/checkout/CheckoutShippingReview.tsx` — monochromatic card styling
3. `src/components/checkout/CheckoutProgressIndicator.tsx` — black/white step indicator with no gradients

## Visual Result
- Clean monochromatic checkout matching Lululemon aesthetic
- Red accent only on primary CTA (Pay Now)
- No green, blue, or purple colored sections
- Shipping review shows all gift details inline (no redundant message card)
- Progress indicator uses black circles with white numbers/checkmarks

