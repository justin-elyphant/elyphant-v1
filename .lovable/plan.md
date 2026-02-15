

## Scale Up Header Components to Fill the Row

### Problem
The header row (h-14 / 56px on desktop) has plenty of vertical space, but the icons, avatar, and logo text are undersized -- making the header feel empty rather than compact and unified like Etsy's.

### Changes

**1. Bigger Logo Text (ElyphantTextLogo.tsx)**
- Increase text from `text-lg lg:text-xl` to `text-xl lg:text-2xl`
- This makes "Elyphant" more prominent and proportional to the icon

**2. Bigger Utility Icons (ModernHeaderManager.tsx)**
- Heart icon: `h-5 w-5` to `h-6 w-6` (20px to 24px, matching Etsy)
- Both desktop and mobile Heart buttons get the bump

**3. Bigger Cart Icon (OptimizedShoppingCartButton.tsx)**
- ShoppingCart icon: `h-5 w-5` to `h-6 w-6`

**4. Bigger Avatar (UserButton.tsx)**
- Desktop avatar: `h-8 w-8` to `h-9 w-9`
- Mobile avatar: `h-8 w-8` to `h-9 w-9`
- This fills the row height better without overflowing

### What Stays the Same
- Header height (h-12 md:h-14) -- no change
- Category text size (text-sm) -- already matches Etsy
- Search bar -- no change
- All functionality and layout structure

### Technical Details

**Files to modify:**

1. `src/components/ui/ElyphantTextLogo.tsx` -- bump text size classes
2. `src/components/navigation/ModernHeaderManager.tsx` -- Heart icons from h-5 to h-6
3. `src/components/marketplace/components/OptimizedShoppingCartButton.tsx` -- ShoppingCart icon from h-5 to h-6
4. `src/components/auth/UserButton.tsx` -- Avatar from h-8 w-8 to h-9 w-9 (both mobile and desktop trigger avatars)

