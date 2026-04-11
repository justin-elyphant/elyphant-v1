

## Beta Emails Analysis and Share Limit Update

### Current Beta Email Templates (4 total)

1. **`beta_approval_needed`** — Internal alert to justin@elyphant.com when a new referral arrives. Shows referrer/invitee details and links to Trunkline.
2. **`beta_invite_welcome`** — Sent to invitee when they receive an invitation. Describes the $100 credit and how to join.
3. **`beta_approved`** — Sent to approved tester. Includes credit details, testing guide (5 steps), and feedback schedule.
4. **`beta_checkin`** — Stage-aware progress email with personalized feedback survey link. Shows completion checklist and activity stats.

### What Needs Updating

Three templates reference inviting friends but do not mention the 2-invite limit:

**1. `beta_approved` template (line 1409)**
Current: "Invite a friend or family member -- Share your invite link so you can test gifting to each other. They'll get $100 in credit too."
Update to: "Invite up to 2 friends or family members -- Share your invite link (you get 2 invites) so you can test gifting to each other. They'll each get $100 in credit too."

**2. `beta_checkin` template (line 1529)**
Current: "Invite a friend or family member so you can test gifting to each other."
Update to: "Invite a friend using one of your 2 invite links so you can test gifting to each other."

**3. `beta_checkin` template (line 1498)**
Current: step label is "Invited a friend"
Update to: "Invited a friend (2 invites available)"

### What Does NOT Need Changes

- **`beta_approval_needed`** — Admin-only internal alert, no user-facing invite language.
- **`beta_invite_welcome`** — Sent to the invitee (recipient), not the inviter. The invite limit is irrelevant here.
- **`beta-checkin-emailer/index.ts`** — Data pipeline only, no template text.

### Implementation

One file change: `supabase/functions/ecommerce-email-orchestrator/index.ts` -- update 3 strings in the `betaApprovedTemplate` and `betaCheckinTemplate` functions. Then redeploy the edge function.

