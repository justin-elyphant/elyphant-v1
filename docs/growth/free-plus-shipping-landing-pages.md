# Free + Shipping Landing Page Strategy

_Status: Brainstorm / pre-build. Owner: Justin. Last updated: 2026-06-25._

## TL;DR

Build single-purpose landing pages (`/lp/:slug`) that offer a free branded product in exchange for shipping fee + lead data (name, email, shipping address, marketing consent). Use them as a low-CAC acquisition channel for Elyphant and as a lead-gen service for partner brands.

First test: **Twins Special hand wraps** targeting MMA/boxing/fitness audiences on Meta + TikTok.

---

## Why this works

This is a well-known DTC playbook with several aliases:

- **Free + Shipping offer** — popularized by Russell Brunson / ClickFunnels. Used by Dollar Shave Club, MealEnders, countless DTC brands.
- **Lead-gen / squeeze page** — single CTA, no nav, optimized for conversion.
- **Tripwire funnel** — a tiny front-end purchase qualifies the lead (they pulled out a card) before entering the main funnel.
- **Co-branded product seeding** — partner brand supplies inventory at COGS or free in exchange for lead data + brand exposure.

### Why it fits Elyphant's stage

- **Intent qualification beats newsletter signups.** Someone entering a shipping address + paying $5–8 is 10–50× more valuable than an email-only lead.
- **Cheap CAC.** Free+shipping CAC in fitness typically $4–12 vs. $40–80 for a generic marketplace homepage signup.
- **Investor narrative.** "25K verified buyers across 6 verticals at $7 blended CAC" is a much stronger Seed slide than raw traffic.
- **Brand partnerships compound.** Once Twins sees the lead report, adjacent brands say yes faster.

---

## First campaign: Twins Special Hand Wraps

- **Partner:** Twins Special (twins-special.com)
- **Product:** Hand wraps (red/white/blue/black), retail $24.99, est. COGS $4–6
- **Offer:** "Get a free pair of Twins Special hand wraps — just pay shipping ($7.95)"
- **Audience:** MMA / Muay Thai / boxing / combat-fitness interests on Meta + TikTok
- **Shipping:** USPS Ground Advantage ~$5–6 for 6oz soft pack; charge $7.95–9.95 (covers fulfillment + small margin)
- **Lead share with Twins:** name, email, shipping address, opt-in timestamp. **Never** payment data.

---

## Page architecture (one component, many LPs)

### Route
- `/lp/:slug` (e.g. `/lp/twins-wraps`, `/lp/yeti-mug`)
- No nav, no footer links back to elyphant.ai
- Confirmation page (`/lp/:slug/thanks`) introduces Elyphant + prompts account creation

### Data model
- `landing_pages` table — slug, headline, subhead, hero image, product title, partner brand, COGS, shipping price, consent copy, pixel IDs (Meta, TikTok, GA4), active flag, A/B variant group
- `leads` table — landing_page_id, name, email, phone, shipping address, consent_at, stripe_session_id, partner_shared_at, utm fields

### Checkout flow
- Reuse existing `create-checkout-session` edge function
- Single line item = shipping fee, $0 product line
- `metadata.lp_slug` so `stripe-webhook-v2` knows to write a `leads` row instead of (or in addition to) an `orders` row
- Optional: collect phone for SMS opt-in

### Admin
- Leads-per-LP dashboard, conversion rate, CAC vs. ad spend, exportable CSV to hand to brand partner

---

## Pre-build checklist

1. **Shipping economics per SKU** — confirm shipping price > fulfillment cost + handling.
2. **Legal / CAN-SPAM + data-sharing disclosure** — one clear sentence near CTA + opt-in checkbox stating data is shared with named brand partner.
3. **Pixels** — Meta, TikTok, GA4, plus first-party event to `user_events` for retargeting + per-LP ROAS.
4. **One page / one offer / no nav** — strict rule.
5. **A/B test discipline** — vary headline OR hero OR social proof, never multiple at once. Same product per test.
6. **Fulfillment pipeline** — who picks/packs/ships? Twins direct? 3PL? Manual at first?
7. **Refund / undelivered policy** — short, generic 3rd-party phrasing (per platform return policy memo).

---

## Open questions (to discuss next)

- _Justin to add as we keep brainstorming._

---

## Suggested MVP build order (when ready)

1. `landing_pages` + `leads` tables (RLS + grants + service_role access for webhook)
2. `/lp/:slug` route + shared `LandingPage` component + `LeadCaptureForm`
3. Wire `create-checkout-session` shipping-only mode + extend `stripe-webhook-v2` to write leads
4. First live page: `/lp/twins-wraps`
5. Admin leads dashboard + CSV export
6. Add LP #2 in a different vertical for A/B partner-fit signal
