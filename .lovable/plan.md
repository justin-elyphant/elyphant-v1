

# Vendor Portal Build Plan

## Current State

**What exists:**
- `vendor_accounts` table (id, user_id, company_name, contact_email, approval_status, approved_by)
- `vendor_locations` table (address, coordinates, service_area, shipping_time)
- Auth: `VendorPortalAuth` (login/signup), `VendorGuard` (role + approval check via `has_role()`)
- Routes: `/vendor-portal` (auth), `/vendor-management` (dashboard — single page with tabs)
- Tab components: Products, Support, Integrations, Advertising, Analytics (all mock data)

**What's wrong:**
- `VendorManagement.tsx` is a monolithic tab page — no sidebar nav, no nested routes
- No vendor portal layout shell (uses consumer app chrome)
- All data is mocked — no real DB queries
- Missing: orders view, earnings/payouts, settings, storefront builder

---

## Build Phases

### Phase 1: Layout & Navigation Shell
Convert the monolithic `/vendor-management` tab page into a proper portal with persistent sidebar navigation and nested routes.

**Create:**
- `src/components/vendor/layout/VendorPortalLayout.tsx` — sidebar + top bar + content area
- `src/components/vendor/layout/VendorSidebar.tsx` — persistent nav (Dashboard, Orders, Products, Analytics, Support, Settings)
- `src/components/vendor/layout/VendorTopBar.tsx` — company name, notification bell, avatar dropdown

**Modify:**
- `src/App.tsx` — replace single `/vendor-management` route with `/vendor/*` nested routes
- `src/pages/VendorManagement.tsx` — convert to layout wrapper with `<Outlet />`

**Route structure:**
```text
/vendor              → Dashboard (overview metrics)
/vendor/orders       → Order list (vendor-scoped)
/vendor/products     → Product management (existing tab, upgraded)
/vendor/analytics    → Analytics (existing tab)
/vendor/support      → Support & Returns (existing tab)
/vendor/settings     → Account settings, shipping config, integrations
```

**Design:** Slate/neutral SaaS tones per memory (`vendor-portal-design-standards`). Plus Jakarta Sans for headings, Inter for body. Lucide icons at 18px/1.5 stroke.

### Phase 2: Dashboard Page
The landing page vendors see after login — key metrics at a glance.

**Create:**
- `src/pages/vendor/VendorDashboard.tsx` — overview cards (total orders, revenue, pending orders, active products)
- Mock data initially, wired to real queries in Phase 4

### Phase 3: Vendor Orders View
Vendors need to see and manage orders for their products.

**Database:**
- Create `vendor_orders` table: id, vendor_account_id, order_id (FK to orders), status (pending/accepted/shipped/delivered), line_items (JSONB), shipping_address_masked (JSONB — city/state only), total_amount, vendor_payout, created_at, updated_at, metadata (JSONB)
- RLS: `auth.uid()` must match the vendor_account's user_id (via join or SECURITY DEFINER function)

**Create:**
- `src/pages/vendor/VendorOrders.tsx` — order list with status filters
- `src/components/vendor/orders/VendorOrderCard.tsx` — individual order with accept/ship actions

### Phase 4: Real Data Integration
Wire existing mock tabs to real Supabase queries.

**Create:**
- `src/hooks/vendor/useVendorAccount.ts` — fetch current vendor's account
- `src/hooks/vendor/useVendorOrders.ts` — fetch vendor-scoped orders
- `src/hooks/vendor/useVendorProducts.ts` — fetch vendor's products from products table

**Modify:**
- Products tab → query `products` where `vendor_id = current_vendor.id`
- Analytics tab → query real order/revenue data
- Support tab → query real return requests

### Phase 5: Settings Page
Central place for vendor account configuration.

**Create:**
- `src/pages/vendor/VendorSettings.tsx` — account info, shipping config, Shopify integration, notification preferences
- Shipping config: flat rate input, free shipping toggle (per plan.md shipping strategy)
- Shopify token connection (existing `ConnectShopifyForm` reused)

### Phase 6: Vendor Products — Manual Entry & CSV
For platform-exclusive vendors who don't use Shopify.

**Create:**
- `src/components/vendor/products/ManualProductForm.tsx` — title, description, price, images, variants, category (Zod validated)
- `src/components/vendor/products/CSVUploadFlow.tsx` — template download, upload, validation preview, error display

---

## Implementation Order

I recommend building in this sequence, one phase per prompt cycle:

1. **Phase 1** — Layout shell + routes (foundational, everything depends on this)
2. **Phase 2** — Dashboard page (gives vendors something to see immediately)
3. **Phase 3** — Orders table + view (core vendor value prop)
4. **Phase 4** — Real data hooks (replaces mocks)
5. **Phase 5** — Settings page (shipping config, integrations)
6. **Phase 6** — Manual product entry + CSV upload

Each phase is independently shippable. Shall I start with Phase 1?

