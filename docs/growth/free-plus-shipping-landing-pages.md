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

## Working with Nick (marketing) on A/B testing

Nick mentioned: _"then you'll send us the page and we'll do our A/B testing on it then have you make the adjustments from there."_ Two interpretations, both compatible with Lovable:

### 1. Ad-level A/B testing (most likely what Nick means)
LP stays the same. Nick runs multiple ad creatives/audiences in Meta/TikTok pointing at the **same LP URL** and measures which ad → LP combo converts best. He reports the winning angle; we update LP copy to match. **Zero extra infra — same-day copy edits on our side.**

### 2. Page-level split testing
Two LP versions live at the same URL, traffic split 50/50, tool measures winner. Three ways to do this on Lovable:

| Option | How it works | Effort | Best when |
|---|---|---|---|
| **Variant slugs** | `/lp/twins-wraps-a` vs `/lp/twins-wraps-b`. Nick splits ad spend 50/50 between URLs. | Zero extra infra — falls out of the `landing_pages` table. | MVP, small budgets |
| **Built-in split** | One URL, server randomly assigns variant on first visit, sticks via cookie, logs to `lead_events`. | ~1 day to build into `LandingPage`. | Once running 3+ LPs |
| **3rd-party tool** | PostHog Experiments / VWO / GrowthBook script tag. Nick edits variants in their UI, no code from us. | 30 min to add script tag. | Nick wants to self-serve variants |

### Recommendation for our stage
At pre-revenue ad budgets ($20–100/day), page-level split tests take weeks to reach statistical significance (need ~1,000 conversions/variant). **Ad-level testing converges 5–10× faster** because Meta optimizes in real time. Plan:

- **Months 1–3:** Nick A/Bs at the ad level. We ship copy/layout updates weekly based on his learnings.
- **Once an LP hits $5K+/mo ad spend:** add PostHog Experiments (or variant slugs) for true page-level splits.

### Suggested message back to Nick
> "The page lives on our app, so any copy/layout change is a quick edit on our side — usually same-day. For split testing, two options: (a) you A/B at the ad level and tell us the winning angle to bake in, or (b) we wire in PostHog Experiments so you can spin up variants yourself. Which workflow do you prefer?"

---

## Handoff to Nick — what he actually needs

Once an LP is live (e.g. `https://elyphant.ai/lp/twins-wraps`), Nick has everything he needs to run ads on Meta / TikTok / Google. The full handoff is just **three things**:

1. **The LP URL** — he points all ad traffic here.
2. **UTM convention** — every ad tagged like `?utm_source=meta&utm_campaign=twins-wraps-jan&utm_content=video-a`. We log UTMs on every lead so we can attribute signups to specific ads/creatives in our admin.
3. **His pixel IDs** — Nick provides **Meta Pixel ID** and **TikTok Pixel ID** (and Google Ads conversion ID if used). We embed them in the LP so his ad platforms can track conversions and auto-optimize bidding. **Without pixels, CAC runs 3–5× higher** because Meta/TikTok can't learn who converts.

Nick controls creative, audience, budget, and bidding entirely on his side. We control the page.

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
