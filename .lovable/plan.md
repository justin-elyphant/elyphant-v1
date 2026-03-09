

# Add Elyphant Logo to Vendor Portal

## Changes

### 1. Vendor Sidebar — Replace "Vendor Portal" text with logo
**File**: `src/components/vendor/layout/VendorSidebar.tsx`

Replace the logo area (lines 56-74) so that:
- **Expanded**: Show `ElyphantTextLogo` (clicking navigates to `/`), with the collapse button beside it
- **Collapsed**: Show just the elephant icon image (`/lovable-uploads/9b4f3dc7-...png`) linking to `/`, with the expand button below or beside it

### 2. Vendor Auth Page — Add logo above the card
**File**: `src/components/vendor/auth/VendorPortalAuth.tsx`

In both return blocks (confirmation view ~line 245 and main view ~line 300):
- Add `ElyphantTextLogo` wrapped in `<Link to="/">` at the top of the outer div, before the centered card container

### Files
- **Edit**: `src/components/vendor/layout/VendorSidebar.tsx` — import `ElyphantTextLogo`, replace "Vendor Portal" text with logo
- **Edit**: `src/components/vendor/auth/VendorPortalAuth.tsx` — import `ElyphantTextLogo`, add logo block to both views

