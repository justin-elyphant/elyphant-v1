

## Beta Tester Analytics Dashboard — Trunkline /referrals Enhancement

### What this solves
Right now the Beta Program page only shows approval status and credit balances. You have no visibility into **what testers are actually doing** — are they searching products? Building wishlists? Scheduling gifts? Completing the onboarding steps from the welcome email? Industry-standard SaaS beta tracking focuses on **activation, engagement, and feature adoption** — all achievable with data you already capture.

### What we'll build
Add a new **"Tester Activity & Insights"** tab/section to the existing Beta Program page with four components:

---

**1. Activation Funnel (Are testers completing onboarding?)**

A visual step funnel showing how many testers have completed each step from the welcome email:

| Step | Data Source | How we check |
|------|-----------|--------------|
| Signed up | `beta_referrals` status = credit_issued | Already tracked |
| Built a wishlist | `wishlists` table — any wishlist created by tester | JOIN on user_id |
| Invited a friend | `beta_referrals` — tester appears as referrer_id | Already tracked |
| Scheduled a gift | `orders` — where scheduled_delivery_date is set | JOIN on user_id |
| Made a purchase | `beta_credits` — any "spent" type entry | Already tracked |

Displayed as a horizontal funnel with percentages (e.g., "80% signed up → 40% built wishlist → 20% scheduled gift").

**2. Per-Tester Activity Summary (What has each tester done?)**

Extend the existing Tester Balances table with new columns:
- **Last Active**: timestamp of most recent `user_interaction_events` entry
- **Wishlists**: count from `wishlists` table
- **Searches**: count from `product_analytics` where event_type = search
- **Status Icons**: green/grey dots for each funnel step completed

This lets you see at a glance who's engaged vs dormant.

**3. Engagement Summary Cards (Top-line metrics)**

Add a second row of stat cards below the existing financial ones:
- **Avg Orders per Tester**: total orders / active testers
- **Avg Credit Utilization**: % of issued credits spent
- **Active Last 7 Days**: testers with any `user_interaction_events` in past week
- **Feature Coverage**: % of testers who've tried 3+ distinct features

**4. Feature Adoption Heatmap (Which features are being tested?)**

A simple bar chart or grid showing usage counts across key features:
- Product search, Wishlist creation, Gift scheduling, Auto-gifts, Connections/invites, Checkout

Data source: `user_interaction_events.event_type` and `product_analytics.event_type`, filtered to beta tester user IDs.

---

### Technical approach

- **No new tables needed** — all data comes from existing tables (`user_interaction_events`, `product_analytics`, `wishlists`, `orders`, `beta_credits`, `beta_referrals`)
- **One new Supabase RPC function** `get_beta_tester_analytics` that aggregates all the above in a single call (avoids N+1 queries per tester)
- **Frontend**: Add a `Tabs` component to the Beta Program page — "Approvals & Credits" (current content) and "Tester Analytics" (new content)
- **Charting**: Use a lightweight bar/funnel visualization with Recharts (already available in the project)

### Files affected
- **New migration**: Create `get_beta_tester_analytics` RPC function
- **New file**: `src/components/trunkline/beta/BetaTesterAnalytics.tsx` — the analytics tab content
- **New file**: `src/hooks/trunkline/useBetaTesterAnalytics.ts` — hook calling the RPC
- **Edit**: `src/components/trunkline/TrunklineReferralsTab.tsx` — wrap existing content in tabs, add analytics tab

### What this gives you (without any third-party tool)
- See which onboarding steps testers skip (fix the email or UX)
- Spot dormant testers early (nudge them or follow up)
- Know which features are under-tested before public launch
- Track credit burn rate to forecast ZMA runway
- All built on first-party data you already collect

