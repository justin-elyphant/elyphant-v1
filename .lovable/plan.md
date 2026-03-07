

# Bank Vendor Operations Strategy to Plan

Adding the 5 operational strategy discussions to `.lovable/plan.md`:

## What Gets Banked

### 1. Local Vendor Fulfillment Flow
- Email notification MVP: vendor receives order details via email after Stripe payment
- `fulfillment_method` field on orders (`zinc_api` vs `vendor_direct`) to route webhook logic
- Future: vendor portal with order accept/reject, delivery confirmation, real-time status

### 2. Mixed-Cart Checkout (Split Fulfillment)
- Parent order splits into child orders by fulfillment source
- Checkout UI shows separate delivery timelines per source
- Leverages existing `productSource` field already in 25+ files
- Single Stripe checkout session, split post-payment in webhook

### 3. Vendor Onboarding Funnel (Curated)
- Apply → Admin Review → Shopify Connect → Product Import → Test Order → Go Live
- Manual curation during beta to maintain quality
- Open marketplace later once trust signals and review systems are built

### 4. Pricing Control (Auto 30% Markup)
- Always apply 30% on vendor's Shopify price (including sale prices)
- Vendors set prices on Shopify, Elyphant adds markup automatically
- Simplifies vendor onboarding — no custom pricing UI needed
- Sale prices pass through: if vendor runs 20% off, customer sees lower Elyphant price too

### 5. Geo-Restrictions & Local Delivery
- `delivery_zones` field on vendor record (zip codes or radius)
- Validate against **recipient address** (not buyer) at product page and checkout
- Products outside delivery zone show "Not available for delivery to this address"
- National shipping vendors have no restrictions

## File Changed
- `.lovable/plan.md` — new section: "Vendor Operations Strategy"

