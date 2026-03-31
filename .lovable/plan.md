

## Dynamic Stage-Aware Beta Feedback System

### The idea

Instead of showing the same 6 feature areas every check-in, the system determines each tester's **lifecycle stage** based on their actual platform activity, then presents questions tailored to that stage. The questions evolve naturally as the tester progresses.

### Lifecycle stages

```text
Stage 1: "First Impressions" (Day 1-3, no activity beyond signup)
  - How was onboarding? Was it clear what to do first?
  - First impressions of the platform look & feel?
  - Did you understand what Elyphant does right away?
  - How did you hear about us / what made you sign up?

Stage 2: "Explorer" (Has browsed/searched but no wishlist yet)
  - How was product search? Find what you were looking for?
  - What products did you search for that we didn't have?
  - Rate the product pages — images, descriptions, pricing
  - Anything confusing about navigation?

Stage 3: "Engaged" (Has wishlist OR sent invite, no purchase)
  - Rate the wishlist experience — creating, managing, sharing
  - How was inviting a friend? Did they sign up?
  - Have you tried scheduling a gift? If not, why?
  - What's stopping you from making a purchase?

Stage 4: "Activated" (Has made a purchase or scheduled gift)
  - Rate checkout — smooth or friction?
  - How was the gifting flow end-to-end?
  - Would you use auto-gifts? Why or why not?
  - Would you recommend Elyphant to a friend? (NPS-style)

Stage 5: "Power User" (Multiple purchases, uses auto-gifts)
  - What feature do you use most? Least?
  - What's missing that would make this a daily-use app?
  - Rate the overall platform 1-10 (NPS)
  - Would you pay for this? What would you pay?
```

Every check-in always includes an "Other Comments" open field.

### Timing adjustment

- **Day 2**: First check-in (Stage 1 questions — onboarding/first impressions)
- **Day 7**: Second check-in (stage-aware based on activity)
- **Every 7 days after**: Weekly check-ins that adapt to current stage
- If a tester advances a stage mid-cycle, the next email reflects the new stage

### How it works technically

**1. New table: `beta_feedback_stages`**
- Columns: `id`, `stage_key` (text), `feature_area` (text), `label` (text), `description` (text), `sort_order` (int)
- Seed with the ~20 questions across 5 stages
- Allows adding/editing questions from Trunkline without code changes

**2. New RPC: `get_tester_feedback_stage(p_user_id uuid)`**
- Checks the tester's `created_at` (account age), wishlist count, invite count, order count, auto-gift usage via the existing analytics data
- Returns the stage key (`first_impressions`, `explorer`, `engaged`, `activated`, `power_user`)
- Used by both the edge function (to pick email copy) and the feedback page (to show the right questions)

**3. Update `beta-checkin-emailer` edge function**
- Call `get_tester_feedback_stage` per tester
- Pass the stage to the email template so it can say "Tell us about your first impressions" vs "Rate the checkout experience"
- Day-2 trigger: add a second cron entry or a database trigger on `beta_credits` insert that schedules a one-time check-in 48 hours after approval

**4. Update `BetaFeedback.tsx` (feedback page)**
- On token validation, also fetch the tester's current stage via `get_tester_feedback_stage`
- Load questions from `beta_feedback_stages` for that stage
- Replace the hardcoded `FEATURE_AREAS` array with the dynamic stage-specific questions
- "Other Comments" always appears at the bottom

**5. Update `BetaFeedbackViewer.tsx` (Trunkline)**
- Add a "Stage" column to the feedback table so you can see what stage the tester was in when they responded
- Add stage filter dropdown alongside the existing user/feature filters
- Store the stage on each `beta_feedback` row (new column `feedback_stage`)

**6. Update `beta_checkin` email template**
- Adapt the subject line and body intro per stage (e.g., "How's your first day?" vs "You've been busy — tell us how checkout went")
- The "what to try next" suggestions already adapt based on funnel data; this extends that to the questions themselves

### Files to create
- Migration: `beta_feedback_stages` table + seed data, add `feedback_stage` column to `beta_feedback`
- RPC: `get_tester_feedback_stage` function

### Files to edit
- `supabase/functions/beta-checkin-emailer/index.ts` — call stage RPC, pass stage to email
- `src/pages/BetaFeedback.tsx` — load dynamic questions based on stage
- `src/components/trunkline/beta/BetaFeedbackViewer.tsx` — add stage column + filter
- Email template in orchestrator — stage-aware subject lines and intro copy

### What this gets you
- Day 2 onboarding feedback while the experience is fresh
- Questions that match what the tester has actually done (no asking about checkout if they haven't purchased)
- Natural progression that encourages deeper engagement
- Trunkline visibility into which stage each tester is in when they respond

