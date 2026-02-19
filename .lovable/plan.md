

# Resize Gift Message Container for Desktop + iOS Capacitor Compliance

## Problem

The gift message drawer currently stretches full-width across the entire viewport on desktop (as seen in the screenshot). On desktop, this creates an oversized, awkward layout. The drawer pattern (bottom sheet) is appropriate for mobile but needs constraints on larger screens.

## Solution

### Desktop: Constrain drawer width

Add a `max-w-lg` (32rem / 512px) constraint and center the drawer on desktop using `sm:max-w-lg sm:mx-auto` on the `DrawerContent`. This keeps the bottom-sheet behavior on mobile while making it a compact, centered panel on desktop.

### Mobile/Tablet: iOS Capacitor compliance

- Add `pb-safe` padding to the footer for iPhone home indicator
- Ensure all touch targets (buttons, template cards) meet 44px minimum
- Add `touch-manipulation` to interactive elements to eliminate 300ms tap delay
- Add spring-style transitions via existing drawer animation

## Technical Changes

### File: `src/components/cart/ItemGiftMessageSection.tsx`

1. Add `sm:max-w-lg sm:mx-auto` to `DrawerContent` className -- constrains width on desktop
2. Add `touch-manipulation` and `min-h-[44px]` to the inline "Add gift message" button
3. Add `pb-safe` to `DrawerFooter` for iOS safe area
4. Add `touch-manipulation active:scale-[0.98]` to Save/Apply buttons for haptic feedback feel
5. Reduce textarea rows from 4 to 3 for a more compact feel

### File: `src/components/cart/GiftMessageTemplates.tsx`

1. Add `min-h-[44px] touch-manipulation` to each template button for iOS touch targets
2. Reduce `max-h-64` on the scrollable template list to `max-h-48` on mobile for better fit within the constrained drawer

No other files need changes -- the drawer component itself is fine, we just need to constrain the content instance.

