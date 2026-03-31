

## Send Beta Check-In Email to a Specific Tester

### Current state

The `beta-checkin-emailer` edge function processes **all** beta testers at once (designed for the weekly cron). There's no way to target a single user. The "Send Test" button in Trunkline sends a preview with **sample data** and a fake token URL — useful for checking the template, but the feedback link won't actually work.

### What to build

Add an optional `target_email` parameter to the `beta-checkin-emailer` edge function. When provided, it sends only to that one tester (with a real feedback token). When omitted, it processes everyone as usual (cron behavior unchanged).

Then add a "Send Check-In" button in the Trunkline Beta Program tab that lets you pick a tester and fire a real check-in email with a working feedback link.

### Changes

**1. `supabase/functions/beta-checkin-emailer/index.ts`**
- Parse optional `target_email` from request body
- If provided, filter the tester list to only that user (look up user_id from profiles by email)
- Everything else (token generation, personalized data, orchestrator call) stays the same

**2. `src/components/trunkline/TrunklineReferralsTab.tsx`** (or a new small component)
- Add a "Send Check-In Email" action in the Beta Program / Approvals area
- Input field for tester email (or dropdown of known testers)
- Calls `beta-checkin-emailer` with `{ target_email: "justncmeeks@gmail.com" }`
- Shows success/failure toast

### Result

You'll be able to send justncmeeks@gmail.com a real beta check-in email with a working "Give Feedback" link right from Trunkline — and reuse the same button for any tester going forward.

