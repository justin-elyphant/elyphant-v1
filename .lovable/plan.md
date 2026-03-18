
# Strategic Notes

## Local Retailer Partnership Strategy (Banked 2026-03-06)

### The Question
Can Elyphant partner with Shopify/Toast/Square while owning the payment process?

### Answer: No Direct Payment Control — But There's a Better Path

**Reality Check:** Shopify, Toast, and Square will NOT grant payment bypass access. Payments are their core revenue (2.6-2.9% + $0.30 per transaction). Even enterprise-tier partners don't get this.

### Recommended Architecture: "Instacart/Faire Model"

Own the customer relationship and payment (via Stripe), use partner platforms for **read-only data sync only**.

#### How It Works
1. **Product Catalog Sync** — Pull inventory/pricing via read-only APIs (Shopify Storefront API, Square Catalog API)
2. **Elyphant Owns Checkout** — Customer pays through our Stripe Checkout Sessions
3. **Order Push to Vendor** — After payment, notify the retailer via vendor portal, email, or webhook
4. **Retailer Fulfills** — They ship/deliver, we track status

#### Integration Priority
| Platform | API | Use Case |
|----------|-----|----------|
| Shopify Storefront API | Product/inventory sync | Online retailers |
| Square Catalog API | Product sync | Local brick-and-mortar |
| Toast (limited API) | Menu sync | Restaurants/food gifts |
| CSV/Manual Upload | MVP onboarding | Any retailer |

#### Why This Works
- **Elyphant controls payment UX** (no redirect to Shopify checkout)
- **Retailers get orders** without building their own gifting infrastructure
- **Elyphant takes a margin** between what customer pays and wholesale/retail price
- **No platform permission needed** — Storefront APIs are public/read-only

#### Build Order (Future)
1. **MVP:** CSV upload + manual product entry for local retailers
2. **Phase 2:** Shopify Storefront API product feed import
3. **Phase 3:** Vendor order notification system (email + dashboard)
4. **Phase 4:** Square Catalog API integration
5. **Phase 5:** Vendor portal with order management, analytics, payouts

#### Key Insight
Elyphant doesn't need to become "influential enough" for platform access. The Instacart model proves you can build a $10B+ company by owning the customer/payment layer while vendors fulfill. The vendor portal is NOT wasted effort — it's the moat.

---

## Shopify Compliance & Terms Confirmation (Banked 2026-03-06)

### Is Shopify OK With This?
**Yes — explicitly.** The Storefront API is designed for "headless commerce" and third-party marketplace integrations.

- **Storefront API is public/read-only** — no special permissions needed
- **Shopify benefits** from merchant subscriptions + increased sales volume regardless of checkout method
- **Precedent:** Faire, Gorgias, and thousands of headless storefronts use this exact pattern
- **Terms-compliant** because we're not scraping or bypassing — we're using the intended API

### What Shopify Merchants Need to Do
- Provide their **Storefront Access Token** (free, generated in Shopify admin)
- That's it — no app install, no approval process

---

## Finding Shopify Retailers to Partner With (Banked 2026-03-06)

### Discovery Strategies

1. **Technical Detection** — Check any website for `cdn.shopify.com` or `myshopify.com` in page source
2. **Discovery Tools:**
   - **myip.ms** — Search Shopify IP ranges to find stores
   - **BuiltWith.com** — Filter by technology stack + location + revenue
   - **Store Leads** — Database of 4M+ Shopify stores with filtering
   - **Google dorking** — `site:myshopify.com + "local delivery" + "city"`
3. **Inbound Strategy** — Use existing `/vendor-partner` landing page, pitch to local business groups, qualify based on Shopify usage

### Best Approach for Elyphant
Start with **inbound** (vendor partner page + local business outreach) and use **BuiltWith/Store Leads** for targeted outbound in specific cities. Cold outreach works best when you can say "I see you're on Shopify — here's how we can drive gift sales to your store with zero integration work."

---

## Shopify ↔ Zinc Technical Isolation (Banked 2026-03-06)

### Zero Conflict — System Already Designed for Multi-Source

The codebase already has `productSource` enum (`'zinc_api' | 'shopify' | 'vendor_portal' | 'manual'`) across 25+ files.

### Three Natural Isolation Layers

#### 1. Product Catalog Layer (Search & Display) — NO CONFLICT
- Both sources stored in same `products` table
- Shopify: `{ productSource: 'shopify', isZincApiProduct: false }`
- Zinc: `{ productSource: 'zinc_api', isZincApiProduct: true }`
- Pricing normalization in `productUtils.ts` already branches on `productSource`
- `zincMetadataValidator.ts` only flags `isZincApiProduct: true` — Shopify invisible to it

#### 2. Checkout Layer (Stripe) — NO CONFLICT
- Both go through same `create-checkout-session` edge function
- `productSource` passed in Stripe session metadata
- Checkout flow is source-agnostic

#### 3. Fulfillment Layer — ONLY DIFFERENCE (Future Phase 3)
- Zinc → `process-order-v2` → Zinc API → Amazon fulfills
- Shopify → (future) `vendor-order-notification` → Email/webhook → Retailer fulfills
- Simple conditional in `stripe-webhook-v2` based on `productSource`

### What Shopify Integration Actually Touches
| Component | Zinc Impact |
|-----------|-------------|
| New edge function: `shopify-product-feed` | None — new function |
| New table: `vendor_integrations` | None — stores Shopify credentials only |
| Products inserted into `products` table | None — additive rows with `productSource: 'shopify'` |
| `ConnectShopifyForm.tsx` updated | None — existing Shopify UI, not used by Zinc |
| `shopifyUtils.ts` updated | None — replaces mock data with real API calls |

### The 8 Core Edge Functions Are Untouched
Zero modifications to checkout, webhooks, order processing, or any Zinc-related code.

---

## Beta Partner: San Diego Flower Shop (Banked 2026-03-06)

### Partner Details
- **Type:** Local flower shop in San Diego
- **Platform:** Shopify
- **Status:** Agreed to beta test

### What They Need From Us (Before Building)
1. **Onboarding guide** — How to generate a Storefront Access Token in Shopify admin
2. **Product feed integration** — Pull their real catalog via Storefront API
3. **Vendor notification system** — How they'll receive orders (email first, portal later)

### What We Need From Them
1. Shopify store URL (e.g., `their-store.myshopify.com`)
2. Storefront Access Token (free, generated in Shopify admin → Apps → Develop apps)
3. Willingness to fulfill orders received via email notification (Phase 3 MVP)

### Beta Test Plan (Draft)
1. Connect their Shopify catalog to Elyphant
2. Display their flowers alongside Amazon/Zinc products (tagged as "Local Shop")
3. Customer buys flowers on Elyphant → Stripe processes payment
4. Flower shop gets email notification with order details → they fulfill
5. Elyphant takes margin between retail price and payout to vendor

### Open Questions
- What margin makes sense for local retailers? (Industry: 15-25%)
- Do they want to set their own prices on Elyphant or use Shopify prices?
- How do they want to receive orders? (Email? SMS? Dashboard?)
- Do they handle their own delivery or need a delivery partner?
- What's their product catalog size? (affects API sync strategy)

---

## Vendor Revenue Model & Payout Strategy (Banked 2026-03-07)

### Revenue Model: Three Revenue Streams

#### 1. Consumer Markup (30%)
- **How:** 30% added ON TOP of retailer's normal price (consumer-facing charge)
- **Example:** Retailer sells bouquet for $50 → Elyphant lists at $65
- **Net margin after Stripe fees (~2.9% + $0.30) and ops:** ~20% ($13.05 on $65 sale)
- **Justification:** Gifting experience value (scheduling, group gifts, AI recommendations, gift wrapping/messaging)

#### 2. Free Unlimited Listings (Vendor Acquisition)
- **How:** Vendors list unlimited products for free — zero onboarding friction
- **Why:** Solves the supply-side chicken-and-egg problem; vendors have no reason NOT to join
- **Precedent:** Faire, Etsy (free to list, pay on transaction)

#### 3. Tiered Sponsored Ads (Vendor Monetization)
| Tier | Name | Price | Features |
|------|------|-------|----------|
| Free | Basic Listing | $0 | Standard placement in search/browse |
| Paid | Boost | TBD/month | Priority placement in category pages, "Featured" badge |
| Premium | Spotlight | TBD/month | Homepage carousel, AI recommendation priority, analytics dashboard |

### Vendor Payout Strategy

#### Payment Method: Stripe Connect (Long-term)
- Automates payment splitting, 1099 tax reporting, vendor dashboards
- **Beta (1-5 vendors):** Manual bank transfers to reduce setup overhead
- **Scale (5+ vendors):** Migrate to Stripe Connect

#### Payout Schedule
| Vendor Type | Payout Cycle | Rationale |
|-------------|-------------|-----------|
| Perishable/Local (flowers, food) | Net 7 | Fast turnaround, delivery confirmed quickly |
| Standard retail | Net 14 | Industry standard for marketplaces |
| New/high-risk vendors | Net 30 | Trust-building period |

#### Payout Example (Flower Shop)
- Customer pays: $65 (retail $50 + 30% markup)
- Stripe fee: ~$2.19 (2.9% + $0.30)
- Elyphant keeps: $15 markup - $2.19 fees = **$12.81 gross profit**
- Vendor receives: **$50** (their full retail price, Net 7)

### Price Comparison Risk Mitigation
- Focus marketing on **gifting experience**, not product price
- Value props: scheduled delivery, group gifting, AI gift recommendations, gift wrapping/messaging
- Customers pay the premium for convenience, not the product itself

---

## Retailer Landing Page Strategy (Banked 2026-03-07)

### Current State
Brand pages (Apple, Yeti, etc.) use `BrandLandingPage.tsx` with hero images, taglines, and sub-collection carousels via `BrandData` interface. These showcase brands to attract retailer partnerships.

### Competitive Analysis
| Platform | Storefront Model | Gap |
|----------|-----------------|-----|
| **Amazon** | Template-based "Brand Store" with modules | No storytelling, no gifting context |
| **Etsy** | Fixed layout, banner + grid | No customization beyond banner |
| **Faire** | Clean wholesale catalog | No consumer-facing branding |
| **Shopify** | Full website builder | Too complex for a marketplace page |

### Strategy: Self-Service Block-Based Page Builder

Evolve existing `BrandData` into a drag-and-drop block system in the Vendor Portal.

#### Block Types (Tiered by Plan)
**Free Tier:**
- Hero Banner (image + tagline + CTA)
- Product Grid (auto-populated from listings)
- About / Brand Story (text + image)

**Boost Tier ($49/mo):**
- Sub-Collection Carousel (curated product groups)
- "Perfect For" Occasion Tags (Valentine's, Birthday, etc.)
- Testimonials / Social Proof block
- Video embed block

**Spotlight Tier ($149/mo):**
- Full-page editorial layouts (magazine-style)
- Nicole AI Cross-Sell section (dynamic related vendor suggestions)
- Seasonal auto-promotion (auto-surface collections for upcoming holidays)
- Priority placement in marketplace discovery rows

#### Gifting-Native Differentiators (No Competitor Does This)
1. **Occasion-Aware Sections** — Auto-promote seasonal products by leveraging life events system
2. **4-CTA Product Integration** — Every vendor page product has: Add to Cart, Buy Now, Schedule Gift, Create Auto-Gift
3. **Nicole AI Cross-Selling** — "People who gifted from [Brand X] also loved [Brand Y]"
4. **Gifting Analytics for Vendors** — Show vendors WHO is buying (occasion, relationship type, recipient demographics)

#### Implementation Path
1. **Phase 1 (Current):** Static `BrandData` config — Elyphant curates pages for top brands
2. **Phase 2:** Vendor Portal self-service editor — vendors pick blocks, upload assets, preview live
3. **Phase 3:** Drag-and-drop reordering with `@dnd-kit` (already in project)
4. **Phase 4:** Occasion-aware automation + Nicole AI integration

#### Key Insight
Amazon/Etsy storefronts are product catalogs. Elyphant storefronts are **gifting experiences**. The block system lets vendors tell their brand story while the platform handles gifting context (occasions, scheduling, AI recommendations) automatically.

---
## Vendor Operations Strategy (Banked 2026-03-07)

### 1. Local Vendor Fulfillment Flow
- **Email notification MVP:** Vendor receives order details via email after Stripe payment confirms
- **`fulfillment_method` field** on orders (`zinc_api` vs `vendor_direct`) to route webhook logic
- `stripe-webhook-v2` checks `productSource` → Zinc products go to `process-order-v2`, Shopify products trigger vendor email notification
- **Future:** Vendor portal with order accept/reject, delivery confirmation, real-time status updates

### 2. Mixed-Cart Checkout (Split Fulfillment)
- **Parent order** splits into **child orders** by fulfillment source post-payment
- Checkout UI shows **separate delivery timelines** per source (e.g., "Arrives Feb 14 via Amazon" / "Arrives Feb 13 via Local Delivery")
- Leverages existing `productSource` field already in 25+ files
- **Single Stripe checkout session**, split post-payment in `stripe-webhook-v2`
- Each child order routed to appropriate fulfillment path independently

### 3. Vendor Onboarding Funnel (Curated Beta)
- **Flow:** Apply → Admin Review → Shopify Connect → Product Import → Test Order → Go Live
- **Manual curation** during beta to maintain quality and brand alignment
- Admin reviews vendor application before granting Shopify integration access
- Test order required before products go live on marketplace
- **Future:** Open marketplace once trust signals (reviews, ratings, return rates) and automated review systems are built

### 4. Pricing Control (Auto 30% Markup)
- **Always apply 30% markup** on vendor's Shopify price — no exceptions, no custom pricing UI
- Vendors set prices on Shopify, Elyphant adds markup automatically during product sync
- **Sale prices pass through:** If vendor runs 20% off on Shopify, customer sees lower Elyphant price too (30% markup on the sale price)
- Simplifies vendor onboarding — zero pricing configuration needed on Elyphant side

### 5. Geo-Restrictions & Local Delivery
- **`delivery_zones` field** on vendor record (zip codes or radius-based)
- Validate against **recipient address** (not buyer's address) at product page and checkout
- Products outside delivery zone show: "Not available for delivery to this address"
- **National shipping vendors** have no restrictions (delivery_zones = null)
- Geo-validation happens at two points: product detail page (soft warning) and checkout (hard block)

---

## Vendor Portal UI/UX — Typography & Iconography

### Typography
- **Dual-font system**: Plus Jakarta Sans for headings/UI elements, Inter for body text
- Add `font-display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']` to `tailwind.config.ts`
- Type scale (vendor portal only):
  - Page titles: `text-2xl font-semibold tracking-tight font-display`
  - Section headers: `text-lg font-medium font-display`
  - Table headers: `text-xs font-medium uppercase tracking-wider text-slate-500`
  - Metric numbers: `text-3xl font-semibold tabular-nums`
  - Labels/captions: `text-sm text-slate-500`
- Scoped to vendor portal only — consumer app unchanged

### Iconography
- Standardize Lucide icons in vendor portal: `size={18}`, `strokeWidth={1.5}` (thinner/more elegant)
- Color: `text-slate-400` default, `text-slate-700` on hover/active — no brand blue in nav
- Create `VendorIcon.tsx` wrapper component for consistency
- Only metric trend indicators and status dots get color (green/red)

### Files to Create/Modify
- `src/index.css` — Google Font import for Plus Jakarta Sans
- `tailwind.config.ts` — add `font-display` family
- `src/components/vendor/layout/VendorIcon.tsx` — icon wrapper component

---

## Non-Shopify Vendor Experience

### Three Vendor Tiers
1. **Shopify Retailers** — Shopify Storefront API sync, read-only inventory, automated product import
2. **Tech-Savvy Vendors** — Direct API integration, webhook-based inventory sync, custom platform connectors
3. **Platform-Exclusive Vendors** — Manual product creation forms, CSV bulk upload, image uploads, internal inventory management via Elyphant portal

### Platform-Exclusive Vendor Features (CSV/Manual)
- Manual product creation form with image upload (multi-image), pricing, variants (size/color), description, category assignment
- CSV bulk upload with template download, validation preview, error reporting
- In-portal inventory management — stock levels, price updates, product status toggling
- Fulfillment routing via `vendor_direct` — vendor receives order notifications by email, ships directly
- No external platform dependency — Elyphant IS their storefront

### Files to Build (Future)
- `src/components/vendor/products/ManualProductForm.tsx` — full product creation form with image uploads, variants, pricing
- `src/components/vendor/products/CSVUploadFlow.tsx` — template download, file upload, validation preview, error reporting
- `src/components/vendor/products/InventoryManager.tsx` — stock levels, price updates, product status toggling

---

## Vendor Portal Development Guardrails

### 1. No Overengineering
- Build only what's needed for the current phase — no speculative abstractions
- One component = one responsibility; split if >200 lines
- No zero-logic wrapper components
- Reuse existing shadcn/ui and Radix primitives

### 2. Code Bloat Prevention
- No duplicate services/hooks — search before creating
- No unused imports or dead code after refactors
- Shared types in a single `types.ts` per feature area
- No new edge functions without justification (8 core payment functions only)

### 3. Vendor Data Security (RLS)
- Every new vendor table gets RLS with `auth.uid() = user_id`
- Cross-vendor data isolation is absolute
- Use `can_access_vendor_portal()` SECURITY DEFINER function for access checks
- No vendor PII exposed beyond what the vendor owns
- Product data: public-read, vendor-write

### 4. Authentication & Authorization
- Roles stay in `user_roles` table — never on profiles
- Never trust client-side role checks — validate via `has_role()` or `can_access_vendor_portal()` in RLS
- Vendor portal routes gate on `vendor_accounts.approval_status = 'approved'`

### 5. Payment & Order Security
- Stripe Checkout Sessions only — no new Payment Intent flows
- Vendor payout data never exposed client-side
- Vendor order views scoped to own orders; customer addresses masked (city/state only)

### 6. Frontend Conventions
- Lululemon design system: grey (#F7F7F7) bg, black text, white components, red (#DC2626) accent for CTAs only
- Vendor portal uses its own layout (`VendorPortalLayout`) — never share consumer nav
- Full-page routes, not modals, for data-heavy views
- Mobile-first — all vendor views must work on phones

### 7. Database Discipline
- No new columns on `orders` table without checking Phase 2 target (22 columns)
- New vendor tables use JSONB `metadata` for extensible data
- Indexes on all `vendor_id` / `user_id` foreign keys
- `created_at` and `updated_at` with auto-update triggers on every table

### 8. Testing & Validation
- Zod schemas for all form inputs (product forms, CSV uploads, settings)
- Edge function inputs validated server-side
- Manual test before shipping any payment or order flow

---

## Dispute & Refund Handling Strategy

- **Elyphant mediates all refunds** — as the Stripe account owner, Elyphant controls the refund flow for brand consistency
- **Amazon-fulfilled orders:** Recipients use Amazon's gift receipt return process directly (already documented in platform memory)
- **Vendor-fulfilled orders:** Elyphant receives the refund request → notifies vendor → vendor handles physical return logistics → Elyphant issues Stripe refund once confirmed
- **Vendor portal shows read-only "Returns & Refunds" list** — status, reason, payout deduction impact; vendors cannot initiate refunds themselves
- **Vendor payout deductions** — refund amounts are deducted from vendor's next settlement; vendors see this in their earnings dashboard
- **Disputes (chargebacks):** Elyphant handles all Stripe disputes; vendor is notified but does not interact with Stripe directly

---

## Shipping Rate Strategy

- **Shopify-synced products:** Elyphant sets its own shipping rates (flat-rate tiers or free-shipping thresholds) — do NOT pull Shopify shipping rates to maintain pricing control and avoid sync complexity
- **Vendor-direct (platform-exclusive) products:** Vendors define shipping in a simple config (flat rate per product or free shipping) within their product form or vendor settings
- **Amazon/Zinc-fulfilled products:** Shipping is baked into the product price (existing behavior, no change)
- **Future consideration:** Weight-based or zone-based shipping calculator — not needed for MVP, revisit when order volume justifies it

---

## Completed Plans

### Checkout Page Cleanup (Completed 2026-03-06)
- Removed redundant gift message card
- Restyled shipping review to monochromatic (gray) theme
- Replaced purple/blue gradients with black + red accent
- Files: UnifiedCheckoutForm.tsx, CheckoutShippingReview.tsx, CheckoutProgressIndicator.tsx
