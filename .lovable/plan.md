

## Plan: Fix Invite Link Auto-Connect and Beta Referral Attribution

### Root Causes Found

**1. Auto-connect never fires after email signup:**
- InvitePage stores inviter ID in `sessionStorage` and navigates to `/auth?invite_user=<id>`
- The post-signup auto-connect code lives in `Auth.tsx` (lines 132-151)
- BUT: `emailRedirectTo` in SteppedAuthFlow points to `/profile-setup`, NOT `/auth`
- So after email confirmation, the user lands on `/profile-setup` which has NO auto-connect logic
- Additionally, `sessionStorage` doesn't survive the email confirmation redirect (new browser context from email link)

**2. Beta referral record never created:**
- There is literally no code anywhere in the invite flow that inserts into `beta_referrals`
- The table exists, the admin panel reads it, but nothing writes to it during signup

**3. Your specific case:** Justin invited Heather via `/invite/justin`. She signed up, confirmed email, landed on `/profile-setup`. No connection was created, no referral was tracked.

### Solution

**Step 1: Persist invite context in `localStorage` (not `sessionStorage`)**
- In `InvitePage.tsx`: change `sessionStorage.setItem` to `localStorage.setItem` so it survives email confirmation redirects
- Also store the inviter username for referral tracking

**Step 2: Add post-signup auto-connect to the onboarding flow**
- The real entry point after email confirmation is `/profile-setup` or the `AuthCallback` → onboarding flow
- Add invite context processing to `AuthCallback.tsx` (which handles the email confirmation redirect)
- On detecting stored invite context: create connection request + auto-accept + create `beta_referrals` record

**Step 3: Create beta referral record on invite-based signup**
- After auto-connect succeeds, insert into `beta_referrals`:
  ```sql
  INSERT INTO beta_referrals (referrer_id, referred_id, connection_id, status)
  VALUES (inviter_id, new_user_id, connection_id, 'pending')
  ```
- This makes the referral visible in the admin Trunkline panel for $100 credit approval

**Step 4: Manually fix Justin + Heather**
- Insert accepted connection between `a3a6e0fb-...` (Justin) and `49095bac-...` (Heather)
- Insert beta referral record for admin approval

### Files to Modify
1. `src/pages/InvitePage.tsx` -- switch to `localStorage`, store additional context
2. `src/pages/AuthCallback.tsx` -- add invite context processing after email confirmation
3. `src/pages/Auth.tsx` -- keep existing logic as backup for direct auth flow
4. Database: insert connection + referral records for Justin/Heather

### Impact
- All future invite link signups will auto-connect and create referral records
- Works across email confirmation redirects (localStorage persists)
- Admin can see and approve $100 credits in Trunkline

