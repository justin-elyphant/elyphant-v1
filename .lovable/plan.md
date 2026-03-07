

# Phase A-D Integration Plan: Trunkline Bridge + Marketplace Stability

## Stability-First Principle
Zinc API product feed is live and working. All changes will be **additive** — vendor products are layered alongside existing Zinc products, never replacing or disrupting them. The `get-products` edge function, `standardizeProduct`, and `UnifiedProductCard` will be extended, not rewritten.

---

## Phase A: Trunkline-Vendor Bridge

**Goal:** Replace mock vendor data in Trunkline with real `vendor_accounts` queries and build the approval workflow.

### 1. Wire Trunkline Vendors Tab to Real Data
- **Modify** `src/components/trunkline/TrunklineVendorsTab.tsx` — replace `mockVendors` import with a Supabase query to `vendor_accounts`
- **Update** `src/components/trunkline/vendors/types.ts` — align `Vendor` type with the real `vendor_accounts` schema (company_name, contact_email, approval_status, created_at, etc.)
- **Update** `AllVendorsContent` + `VendorsTable` to render real data and show pending/approved/suspended status badges
- Add a "Pending Applications" filter tab showing `approval_status = 'pending'`

### 2. Vendor Approval Workflow
- **Create** `src/hooks/trunkline/useVendorApproval.ts` — calls a new edge function
- **Create** `supabase/functions/approve-vendor/index.ts` — SECURITY DEFINER approach:
  1. Validates caller has `employee` role via `has_role()`
  2. Updates `vendor_accounts.approval_status` to `approved` + sets `approved_by`
  3. Inserts `vendor` role into `user_roles` table for that vendor's `user_id`
  4. Returns success
- **Add** approve/reject/suspend buttons to `VendorsTable` rows
- Reject action: sets `approval_status = 'rejected'`, does NOT insert role

### 3. Payouts Tab — Real Data
- **Update** `PayoutsContent.tsx` — query `vendor_orders` grouped by `vendor_account_id` to show real payout totals per vendor

---

## Phase B: Marketplace Integration (Stability-First)

**Goal:** Surface vendor products in the shopper marketplace WITHOUT touching the existing Zinc product pipeline.

### Key Safety Measures
- `get-products` edge function currently has zero vendor awareness — vendor products are simply in the `products` table with `vendor_account_id IS NOT NULL`
- The cache lookup in `get-products` already queries the `products` table by `source_query` match — vendor products (with `source_query: 'vendor_manual'` or `'vendor_csv'`) will naturally be included in cache lookups IF we add them to the query
- **No Zinc API changes needed** — vendor products bypass Zinc entirely

### 1. Edge Function: Include Vendor Products in Cache Results
- **Modify** `supabase/functions/get-products/index.ts`:
  - In the `transformCachedProduct` function, detect `source_query LIKE 'vendor_%'` products and set `productSource: 'vendor_direct'`
  - Skip the Zinc price normalization (divide-by-100) for vendor products — their prices are already in dollars
  - Set `fulfillment_method: 'vendor_direct'` in the response so the frontend knows
  - Vendor products already have `image_url`, `title`, `price` in the products table — no Zinc enrichment needed

### 2. Frontend: Handle `vendor_direct` Product Source
- **Modify** `src/components/marketplace/product-item/productUtils.ts` `standardizeProduct`:
  - Add `vendor_direct` to the `productSource` detection (line ~256): if `source_query` starts with `vendor_`, set `productSource: 'vendor_direct'`
  - Skip cents-to-dollars conversion for `vendor_direct` products
- **Modify** `src/types/product.ts` — add `'vendor_direct'` to the `productSource` union type
- **Modify** `src/contexts/ProductContext.tsx` — same union type update
- Product cards, detail pages, and price formatting already use `productSource` — adding a new value is safe

### 3. Product Detail Page for Vendor Products
- **Modify** `src/services/ProductCatalogService.ts` — when fetching product detail for a `vendor_` prefixed product_id, query `products` table directly instead of calling `get-product-detail` (which calls Zinc)
- Vendor detail pages show: title, price, images, description, vendor name — no Amazon reviews section

---

## Phase C: Checkout Fulfillment Split

**Goal:** When a cart contains both Zinc and vendor products, create separate fulfillment paths post-payment.

### 1. Tag Line Items in Checkout
- **Modify** `supabase/functions/create-checkout-session/index.ts`:
  - Accept `fulfillment_method` per line item from the frontend cart
  - Store in `session.metadata.line_items[].fulfillment_method` ('zinc_api' | 'vendor_direct')
  - Store `vendor_account_id` for vendor items

### 2. Webhook: Split Orders by Fulfillment
- **Modify** `supabase/functions/stripe-webhook-v2/index.ts`:
  - After creating the parent order, group line items by `fulfillment_method`
  - For `zinc_api` items: continue existing pipeline → `process-order-v2`
  - For `vendor_direct` items: insert into `vendor_orders` table with status `pending`, linking to the parent order
  - MVP notification: send email to vendor's `contact_email` via Resend (already installed)

### 3. Frontend Cart Awareness
- **Modify** cart context/components to pass `fulfillment_method` and `vendor_account_id` when adding vendor products
- Display estimated delivery separately: "Ships from [Vendor Name] — 3-5 business days" vs "Ships from Amazon — 2 day delivery"

---

## Phase D: Order Lifecycle Sync

### 1. Vendor Ships → Shopper Sees Tracking
- **Add** `tracking_number` and `tracking_url` fields to `vendor_orders` (already exist in schema)
- When vendor updates status to `shipped` in their portal → update parent `orders` table status
- Display tracking in shopper's order history

### 2. Trunkline Payouts Tab
- Wire to real `vendor_orders` financial data (total_amount, vendor_payout) grouped by vendor and time period

---

## Implementation Order
1. Phase A (Trunkline bridge) — no marketplace risk
2. Phase B (marketplace integration) — additive only, guarded by `productSource` checks
3. Phase C (checkout split) — requires Phase B
4. Phase D (lifecycle) — requires Phase C

Each phase is independently deployable. Existing Zinc product feed remains untouched throughout.

