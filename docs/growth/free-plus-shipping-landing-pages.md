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

## Lead → User conversion (DECISION: Option B, silent account creation)

Are LP signups just an email list, or actual Elyphant users? **Decision: silent account creation.** Every paid LP signup becomes a provisional Elyphant user automatically — zero added friction on the LP, but the entire list becomes a real user base instead of a marketing list.

### Three options we considered

| Option | LP conversion | Investor value | Decision |
|---|---|---|---|
| **A. Pure lead capture** (email list only) | Highest | Low — email list, not users. Requires re-acquisition (2nd CAC). | ❌ |
| **B. Silent account creation** (provisional user + magic link) | Same as A | High — "25K users at $7 CAC" | ✅ **Chosen** |
| **C. Force signup on LP** | Drops 40–60% | Moot — kills the funnel | ❌ |

### Why Option B fits Elyphant's existing architecture
- We already have the provisional-user pattern: `pending_gift_invitations`, `temporary_giftee_profiles`, `pending_recipient_addresses`.
- Unified onboarding RPC (`complete_onboarding`) can finish their profile when they claim.
- Supabase magic link auth + `auth-email-hook` already wired and styled.

### Flow

```text
1. User submits LP form + pays shipping (Stripe Checkout)
2. stripe-webhook-v2 receives checkout.session.completed with metadata.lp_slug
3. Webhook creates, in order:
   - auth.users row (Supabase admin API)
   - profiles row { account_status: 'unclaimed', acquisition_source: 'lp:twins-wraps', acquisition_partner: 'twins-special' }
   - user_addresses row (from Stripe shipping address)
   - leads row { landing_page_id, profile_id, utm_*, partner_shared_at: null }
4. Confirmation email + shipping email both contain a one-click magic link → /welcome?token=...
5. On click: stripped-down onboarding (skip address — we have it; pick interests + set password) → account_status: 'active'
```

### New profiles columns we'll need
- `account_status` enum: `unclaimed | active | dormant`
- `acquisition_source` text (e.g. `lp:twins-wraps`, `organic`, `referral:xyz`)
- `acquisition_partner` text (e.g. `twins-special`) — for partner reporting

### Reporting funnel (the Seed-deck slide)
1. **Leads** — paid shipping on an LP
2. **Activated users** — clicked magic link, claimed account
3. **Engaged users** — added wishlist item / connected a friend / made a 2nd purchase
4. **Retained users** — active 30 / 60 / 90 days post-activation

### Guardrails
- `account_status: 'unclaimed'` users are **excluded** from active user counts, social discovery, and connection suggestions until they claim.
- Magic link in shipping email is the highest-leverage activation moment (~70% open rate on shipping confirmations).
- Partner lead exports (Twins) only include name/email/address — never Elyphant account status, password, or platform behavior.

---

## Operational home: Trunkline (NOT main Elyphant app)

All campaign management, lead data, and partner exports live in **Trunkline** (internal admin). The main Elyphant consumer app stays clean — shoppers should never see partner CAC, ad spend, or lead lists.

### Why Trunkline
- Already role-gated (`business_admins`, employee role separation, `admin_audit_log`)
- Functional > pretty — iterate fast without consumer UX polish
- Confidential by default — partner contracts, CAC, lead lists are not consumer-facing
- Same Supabase DB underneath — Trunkline is just a role-gated view layer, no data duplication

### Trunkline modules to add

**1. Campaigns**
- CRUD `landing_pages` rows (slug, copy, hero, product, partner, COGS, shipping price, pixels, UTM defaults, active flag)
- Preview LP in iframe before going live
- Toggle active/paused; clone an LP to spin a variant in 30 seconds

**2. Leads dashboard (per campaign)**
- Total leads, conversion rate, CAC (needs Nick's ad-spend input), activation rate, 30-day retention
- Filterable table: date, UTM source/campaign/content, account_status, partner_shared_at
- Realtime row count via Supabase realtime for live campaign monitoring

**3. Partner lead export**

_Mode A — Manual CSV download (MVP):_
- Button: "Export leads for Twins (last 7 days)"
- CSV columns: `first_name, last_name, email, address_line1, address_line2, city, state, zip, country, consent_at, shipping_paid_at`
- **Never includes:** account_status, password, browsing/wishlist behavior, other-brand interest, internal CAC, ad spend
- Logs export in `admin_audit_log` (who, when, campaign, row count) — consent paper trail
- Sets `leads.partner_shared_at = now()` on exported rows so partner sees "X new leads since last export"

_Mode B — Automated partner portal (later):_
- Read-only login for partner: `/trunkline/partners/twins`
- Sees only their own campaigns + leads, self-serve CSV download
- New `partner_users` role scoped to one `acquisition_partner` value
- Pitch to partner as a value-add: "real-time self-serve lead portal"

**4. Compliance checkbox**
Before any CSV generates: _"I confirm this export is covered by the consent text shown on the LP at signup."_ Logged in audit table. Cheap insurance for future GDPR/CCPA questions.

---

## Trunkline → Vendor conversion path (key strategic upside)

Keeping LPs in Trunkline makes **converting the retailer into a full Elyphant vendor partner ~5× easier.** This is a major strategic advantage:

### The natural progression
1. **Stage 1 — Lead-gen partner:** Twins gives free product, we run the LP, deliver CSV leads. Low-commitment, low-trust-required, easy yes.
2. **Stage 2 — Trust built:** Twins sees real lead quality + conversion data over 30–60 days. We have proof their audience exists on Elyphant.
3. **Stage 3 — Vendor pitch:** "You already trust us with your leads — let's list your full catalog on Elyphant. 85/15 split via Stripe Connect, same dashboard you're already using."
4. **Stage 4 — Vendor live:** Same `acquisition_partner` identifier now ties to a `vendor_accounts` row. LP shoppers + organic Elyphant shoppers all flow to the same vendor.

### Why Trunkline makes this seamless
- **Same admin surface** — partner already knows the dashboard from the leads portal; adding a "Products" tab is a familiar extension, not a new platform
- **Same identity** — `acquisition_partner: 'twins-special'` on leads and `vendor_accounts.slug: 'twins-special'` join cleanly; no data migration
- **Same role model** — `partner_users` role upgrades to `vendor_admin` role; existing `business_admins` / vendor portal guardrails already enforced
- **Attribution preserved** — every LP-acquired user keeps `acquisition_source: 'lp:twins-wraps'`, so when they later buy a Twins product through the marketplace, Twins sees the full lifetime journey (lead → customer)
- **Commercial story:** "We acquired N customers for you via lead-gen. Here's their repeat purchase rate on the marketplace. List your catalog and capture that LTV directly."

### Build implication
When designing the `landing_pages.partner` field and the partner portal, use the **same partner slug** that will become the vendor slug. Don't create a separate `lp_partners` table — point both at a shared `partners` table (or extend `vendor_accounts` with a `lead_gen_only` flag for stage-1 partners who haven't onboarded as vendors yet).

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

---

## Plumbing decisions to lock before design

Seven infrastructure decisions to settle now — they're painful to change post-launch.

### 1. URL structure — subpath, not subdomain
**Decision: `elyphant.ai/lp/:slug`** (e.g. `elyphant.ai/lp/twins-wraps`).
- SEO authority flows to the root domain
- One SSL cert, one analytics property, one cookie domain (matters for attribution + magic-link auth)
- Simpler ops than `lp.elyphant.ai` or `twins.elyphant.ai`
- Trade-off: a bad partner LP shares root-domain reputation — mitigated by Trunkline approval gate before any LP goes live

### 2. Route isolation from main app shell
LP routes (`/lp/*`) must render **outside** `MainLayout`/`SidebarLayout` — no Elyphant header, no bottom nav, no auth-aware UI. They're standalone conversion pages.
- Dedicated `LandingPageLayout` wrapper: just `<Outlet />` + minimal footer (legal links only)
- No `<AuthProvider>`-dependent components above the fold (slows TTFB on cold visits from paid social)
- No connection to Nicole AI, cart, or wishlist state — these pages are stateless until form submit

### 3. Analytics & attribution
- **One GA4 property** for the whole domain; LPs tagged with `content_group = 'landing_page'` and `campaign_slug` custom dimension
- **Server-side conversion tracking** via Stripe webhook → Meta CAPI + Google Ads Enhanced Conversions (iOS 14.5+ requires this; client-side pixel alone loses ~30% of conversions)
- UTM params (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) captured on LP load, persisted to `leads.attribution` JSONB, forwarded into Stripe session metadata so they survive to the order record
- Meta Pixel + Google Ads tag fire **on LP only**, not site-wide (keeps main app clean and avoids double-counting)

### 4. Magic-link auth domain
Magic links sent from LP conversion must land on `elyphant.ai/welcome?token=...` (same domain as LP). If we used a subdomain, Supabase auth cookies wouldn't transfer, breaking the activation flow. Subpath choice (decision #1) makes this free.

### 5. Robots / SEO posture for LPs
- LPs are **paid-traffic destinations**, not organic SEO targets
- Add `<meta name="robots" content="noindex, follow">` on `/lp/*` pages — prevents Google from ranking them (would compete with main site) but still passes link equity
- Exclude `/lp/*` from `sitemap.xml`
- Per-LP `canonical` tag points to itself (not main site) so paid traffic doesn't get redirected

### 6. Rate limiting & bot protection
LPs are prime targets for form spam (email list poisoning) and competitor scraping.
- Cloudflare Turnstile on the lead form (invisible, better UX than reCAPTCHA)
- Rate limit lead submissions: 3/min per IP at the edge function level
- Honeypot field in the form (server rejects if filled)
- Email validation via Resend's verification API before insert (catches typos + disposable domains)

### 7. LP lifecycle states
`landing_pages.status` enum needs four states, not just on/off:
- `draft` — exists in Trunkline, not yet routable (404 on `/lp/:slug`)
- `active` — live, accepting leads
- `paused` — live URL shows "campaign ended" message, no form (preserves ad-account quality score vs. hard 404s mid-campaign)
- `archived` — historical record, redirects to main site

Design needs the `paused` state mock too — it's the most visited "off" state since paid ads keep driving traffic for hours after pause.

---

**Now safe to brainstorm design.** Open questions for that phase:
1. Hero treatment — single hero product shot vs. lifestyle imagery vs. video loop
2. Form placement — above-fold inline vs. scroll-to-CTA vs. sticky bottom bar (mobile)
3. Social proof slot — review stars, testimonials, "as featured in", or partner logo lockup
4. Mobile-first layout (70%+ of paid social traffic is mobile)
5. Trust signals around the $5.99 shipping charge (Stripe badge, money-back copy, etc.)
