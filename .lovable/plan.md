

# Fix Horizontal Scroll on Tablet When Signed Out

## Root Cause

The header's "Desktop Right Utilities" section uses `hidden md:flex`, meaning it shows the full-width `AuthButtons` component (containing both "Sign In" and "Get Started" text buttons) at the 768px tablet breakpoint. Combined with the logo, 4 category links, Heart icon, Cart icon, and flex gaps, the total width exceeds the viewport at 768-1024px -- causing horizontal scroll.

When signed in, `UserButton` (a single avatar icon, ~40px) replaces `AuthButtons` (~200px), which is why the layout fits fine after login.

## Fix

Shift the breakpoint for the desktop/mobile right-side sections from `md` (768px) to `lg` (1024px):

- **Desktop Right Utilities**: Change `hidden md:flex` to `hidden lg:flex` -- only shows full AuthButtons on 1024px+ screens
- **Mobile Right Side**: Change `md:hidden` to `lg:hidden` -- shows compact MobileAuthMenu (hamburger drawer) on tablets

This aligns with the existing tablet-as-mobile strategy documented in project memory.

Additionally, add `overflow-x-hidden` to the header's nav container as a safety net.

## What Changes

**File: `src/components/navigation/ModernHeaderManager.tsx`**

| Line | Current | New |
|------|---------|-----|
| 105 | `hidden md:flex items-center gap-2 md:gap-3` | `hidden lg:flex items-center gap-3` |
| 119 | `md:hidden flex items-center ml-auto gap-2` | `lg:hidden flex items-center ml-auto gap-2` |
| 75 | Container div | Add `overflow-x-hidden` |

## Result

On tablet (768-1024px), users see:
- Logo + 4 category links + Heart + Cart + Hamburger menu (compact)

On desktop (1024px+), users see:
- Logo + 7 category links + Search bar + Heart + Cart + Sign In / Get Started buttons (full)

No changes to mobile behavior.
