

## Update Beta Approval Email — Set Feedback Expectations

### Current state

The `betaApprovedTemplate` has a solid testing guide (5 steps) and credit info, but step 5 just says "Reply to this email or message us in the app." There's no mention of the automated check-in emails or what the feedback cadence looks like.

### What to change

**File: `supabase/functions/ecommerce-email-orchestrator/index.ts`** — `betaApprovedTemplate` function (lines 1307-1372)

1. **Replace step 5** in the testing guide from the vague "tell us what you think" to something that sets expectations about the check-in emails:
   - "We'll email you a short feedback survey starting on Day 2, then weekly after that. Each survey takes about 2 minutes and adapts to what you've actually tried. Your responses directly shape what we build."

2. **Add a new section** after the "How credits work" box — a "What to expect" card that clearly lays out:
   - Day 2: Your first feedback check-in (onboarding impressions)
   - Weekly after that: Short surveys that evolve as you use the platform
   - Each email includes a secure link — no login required
   - Links expire after 7 days

3. **Redeploy** the `ecommerce-email-orchestrator` edge function.

### Result

Every new tester will know from their approval email that feedback check-ins are coming, what the cadence is, how easy they are, and why they matter — so the first Day 2 email won't feel unexpected.

