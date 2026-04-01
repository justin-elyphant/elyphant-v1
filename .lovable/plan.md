

## Add Unified Header to Connections Page (Mobile & Tablet)

### Problem

The `/connections` page on mobile and tablet renders its own `MobileConnectionsHeader` (back arrow + "Connections" title + settings gear) instead of the unified app header (`UnifiedShopperHeader` via `SidebarLayout`). This means shoppers lose access to the search bar, cart, and main navigation — inconsistent with every other authenticated page (Settings, Dashboard, Orders, etc.).

### Fix

Wrap the mobile and tablet layouts in `SidebarLayout`, matching the pattern used by the desktop layout and all other authenticated pages. Remove `MobileConnectionsHeader` since `SidebarLayout` already provides the header.

### Changes

**`src/pages/Connections.tsx`**

1. **Mobile layout (line ~433)**: Wrap the mobile return block in `<SidebarLayout>`, remove `<MobileConnectionsHeader />`
2. **Tablet layout (line ~580)**: Wrap the tablet return block in `<SidebarLayout>`, remove `<MobileConnectionsHeader />`
3. The "Connections" title context is already provided by the hero section, so no information is lost

**`src/components/connections/MobileConnectionsHeader.tsx`** — Can be deleted if no other file imports it (it's only used in Connections.tsx)

### Result

All three layouts (mobile, tablet, desktop) will be wrapped in `SidebarLayout`, giving shoppers consistent access to search, cart, and navigation on every device — matching Settings, Dashboard, Orders, and all other pages.

