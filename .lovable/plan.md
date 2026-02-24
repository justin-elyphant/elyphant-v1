

# Tablet Users Getting Desktop Checkout Layout

## Problem

Your beta tester on an iPad is seeing the **desktop checkout layout** (two-column with Order Summary sidebar, category strip in header) instead of the mobile/tablet single-column stacked view. This happens because:

- The checkout page uses `lg:` (1024px) as its desktop breakpoint
- iPads in landscape are ~1180px wide, which exceeds 1024px
- So they get: two-column grid, desktop header with category strip, inline "Proceed to Payment" button instead of sticky bottom CTA

Per your project's design strategy, tablets should use the mobile shell (single-column, sticky bottom CTA, no category strip in header).

## Solution

Bump the checkout page's desktop breakpoint from `lg:` (1024px) to `xl:` (1280px). This ensures all iPads (including landscape) get the single-column mobile layout. No tablet has a viewport wider than 1280px, so this cleanly separates tablet from desktop.

## Changes

### File: `src/components/checkout/UnifiedCheckoutForm.tsx`

Replace all layout-critical `lg:` breakpoints with `xl:`:

| Line | Current | Change to |
|------|---------|-----------|
| 717 | `pb-40 lg:pb-8` | `pb-40 xl:pb-8` |
| 719 | `lg:grid-cols-3 ... lg:gap-6` | `xl:grid-cols-3 ... xl:gap-6` |
| 721 | `lg:col-span-2 ... lg:space-y-6` | `xl:col-span-2 ... xl:space-y-6` |
| 863 | `hidden lg:block` | `hidden xl:block` |
| 892 | `lg:col-span-1 order-first lg:order-last` | `xl:col-span-1 order-first xl:order-last` |
| 893 | `lg:sticky lg:top-6` | `xl:sticky xl:top-6` |

The `md:` breakpoints (768px) for the sticky bottom CTA bar and inline button remain unchanged -- those correctly distinguish phones from tablets/desktop.

### What stays the same
- Mobile sticky bottom CTA bar (md:hidden) -- unchanged
- Desktop inline button (hidden md:flex) -- unchanged, tablets still see it
- BuyNowDrawer changes from earlier -- unaffected
- Header/navigation -- the header already uses `md:` which correctly handles tablet vs phone; the category strip visibility is a separate concern if you want to address it later

## Scope
1 file, ~6 class name substitutions (lg to xl). No logic changes, no backend impact.

