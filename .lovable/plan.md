

## Beta Feedback System — Weekly Check-In Email + Token-Gated Feedback Page + Trunkline Viewer

### Overview

Three connected pieces: (1) a **weekly** personalized check-in email showing each tester's progress, (2) a **token-gated** feedback page (not publicly accessible — requires a valid token from the email), and (3) a Feedback tab in Trunkline to review all submissions.

---

### Cadence: 7 days, not 14

Weekly is the industry standard for early-stage SaaS betas. It keeps testers engaged while their experience is fresh. Can be dialed back to biweekly later by changing the cron schedule.

---

### Part 1: Database

**New tables (via migration):**

- `beta_feedback` — stores structured feedback (user_id, feature_area, rating 1-5, feedback_text, created_at). RLS: authenticated users insert their own; admins select all.
- `beta_feedback_tokens` — maps a unique UUID token to a user_id with an expiry (7 days). Used to gate the feedback page. RLS: no public access; only the edge function (service role) creates tokens; the feedback page validates via an RPC.

**New RPC:** `validate_beta_feedback_token(p_token uuid)` — returns user_id if token is valid and not expired, null otherwise. Security definer so it bypasses RLS.

---

### Part 2: Weekly Check-In Email

**New email template** `beta_checkin` added to `ecommerce-email-orchestrator`:
- Personalized greeting with first name
- "What you've done" — green checks for completed funnel steps
- "What to try next" — greyed steps not yet completed, with encouragement
- "Give Feedback" CTA button linking to `/beta-feedback?token={unique_token}`
- Same Lululemon-inspired style (baseEmailTemplate, 300-weight type, no emojis)

Subject: `Your Elyphant Beta Check-In`

**New edge function** `beta-checkin-emailer`:
- Triggered by pg_cron **every 7 days**
- Queries all active beta testers (users with issued credits)
- For each tester: generates a feedback token, assembles personalized data (funnel steps completed, activity counts), calls the orchestrator with `beta_checkin` event
- Inserts token into `beta_feedback_tokens` with 7-day expiry

---

### Part 3: Token-Gated Feedback Page

**New route** `/beta-feedback` — but **NOT publicly browsable**:
- On load, reads `?token=` from URL
- Calls `validate_beta_feedback_token` RPC to verify token
- If invalid/expired/missing → shows "Invalid or expired link" message, no form
- If valid → shows personalized feedback form with the tester's first name

**Feedback form contents:**
- Feature cards: Product Search, Wishlists, Gift Scheduling, Checkout, Auto-Gifts, Connections — each with 1-5 rating + text area
- "Other Comments" open text area
- Submit button → inserts rows into `beta_feedback`

**Access control:** No login required (testers click from email), but the token is single-use or time-limited. Without a valid token, the page shows nothing useful.

---

### Part 4: Trunkline Feedback Viewer

**New tab** "Feedback" added to the existing Tabs in `TrunklineReferralsTab.tsx` (alongside "Approvals & Credits" and "Tester Analytics").

Shows:
- Summary cards: total submissions, average rating per feature, response rate
- Sortable/filterable table: tester name, feature area, rating, comment, date
- Filter by feature area

**New component:** `src/components/trunkline/beta/BetaFeedbackViewer.tsx`

---

### Technical details

**Files to create:**
- `supabase/migrations/...` — `beta_feedback` table, `beta_feedback_tokens` table, `validate_beta_feedback_token` RPC, RLS policies
- `supabase/functions/beta-checkin-emailer/index.ts` — weekly cron edge function
- `src/pages/BetaFeedback.tsx` — token-gated feedback form
- `src/components/trunkline/beta/BetaFeedbackViewer.tsx` — Trunkline feedback tab

**Files to edit:**
- `supabase/functions/ecommerce-email-orchestrator/index.ts` — add `beta_checkin` template + case
- `src/components/trunkline/TrunklineReferralsTab.tsx` — add "Feedback" tab trigger + content
- `src/App.tsx` — add `/beta-feedback` route
- `src/components/trunkline/communications/EmailTemplatesManager.tsx` — add `beta_checkin` to preview list
- `supabase/config.toml` — add `beta-checkin-emailer` function config + cron entry

