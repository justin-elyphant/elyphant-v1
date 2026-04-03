

## Build Native Package Tracking UI (Replace 17Track Links)

### Problem

Clicking "Track Package" opens 17Track — a third-party site with banner ads, "Zinc" carrier branding, and no connection to Elyphant. This undermines the premium gifting experience.

### Solution

Build a branded, in-app tracking view using data already available from Zinc's `tracking[]` array. Keep external links as a secondary "View on carrier site" option, but make the primary experience native.

### What changes

**File 1: `src/components/orders/TrackingInfoCard.tsx`** — Redesign from a simple "copy tracking number + external link" card into a rich tracking timeline card:

- Show a visual step-by-step timeline (Ordered → Shipped → In Transit → Out for Delivery → Delivered) with timestamps pulled from `order.notes` and `order.merchant_tracking_data`
- Display carrier name as "Amazon Logistics" or "USPS" (never "Zinc" or "Zinc Logistics")
- Show delivery proof image when available (from `notes.delivery_proof_image`)
- Include estimated delivery date prominently
- Demote "Track on carrier site" to a small secondary link at the bottom (use Amazon's `retailer_tracking_url` when available, fall back to 17Track only as last resort)
- Keep copy-tracking-number functionality

**File 2: `src/components/orders/TrackingInfoCard.tsx` — Carrier detection cleanup:**

- Rename "Zinc Logistics" → "Package Carrier" or resolve to actual carrier (Amazon Logistics, USPS, etc.) using `merchant_tracking_data.carrier` or `notes.carrier`
- For ZPY-prefix tracking numbers, prefer the Amazon `retailer_tracking_url` over 17Track
- For TBA-prefix numbers, link directly to Amazon tracking

**File 3: `src/components/orders/OrderTimeline.tsx`** — Enhance with Zinc tracking data:

- Parse `tracking[].delivery_status` events into timeline steps with locations and timestamps
- Show delivery location text (e.g., "Package delivered near the rear door or porch") when available from Zinc data
- Add delivery proof photo thumbnail for delivered orders

**File 4: `src/pages/OrderDetail.tsx`** — Wire up the enhanced tracking:

- Pass `notes` data (carrier, delivery_proof_image, zinc_delivery_status) to TrackingInfoCard
- Always show TrackingInfoCard for shipped/delivered orders, even without a tracking number (show status from Zinc)

### Design direction

- Clean, minimal timeline matching Lululemon aesthetic (grey background, black text, red accent for current step)
- Delivery proof image shown in a rounded card with subtle shadow
- No external site branding visible — fully Elyphant-branded
- Mobile-optimized with proper spacing

### What this does NOT change

- No edge function changes — all data already flows from the pipeline fix
- No new API calls — uses existing order data (notes, merchant_tracking_data, zinc_timeline_events)
- External tracking links still available as secondary option for customers who want carrier-native tracking

