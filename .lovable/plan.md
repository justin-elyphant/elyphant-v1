

## Wire Referral Tracking for Beta — $100 Invite Incentive

### Concept
Create a lightweight `beta_referrals` table to track who invited whom and whether the $100 reward has been fulfilled. Surface this in Trunkline as a new "Referrals" tab so the team can see all referrals and manually mark rewards as paid. Update the avatar dropdown (mobile + desktop) and connections hero with the "$100" incentive copy.

### Database

**New table: `beta_referrals`**
```text
id              uuid PK
referrer_id     uuid FK → profiles(id)     -- the person who invited
referred_id     uuid FK → profiles(id)     -- the person who signed up
referred_email  text                        -- email used in invitation
connection_id   uuid FK → user_connections  -- link to the invitation record
status          text DEFAULT 'pending'      -- pending | signed_up | reward_paid
reward_amount   numeric DEFAULT 100.00
reward_paid_at  timestamptz
reward_notes    text                        -- admin notes (e.g., "Paid via Venmo")
created_at      timestamptz DEFAULT now()
```

RLS: employees can read/update all rows. Users can read their own rows (where `referrer_id = auth.uid()`).

**Auto-populate on signup**: Add a trigger that fires when a `user_connections` row transitions from `pending_invitation` to `accepted` — insert a `beta_referrals` row with `status = 'signed_up'` linking `user_id` as referrer and `connected_user_id` as referred.

### Trunkline: Referrals Tab

New page at `/trunkline/referrals` showing a table with:
- Referrer name/email
- Referred name/email
- Signup date
- Status badge (pending → signed up → reward paid)
- "Mark as Paid" button with optional notes field
- Summary stats at top: total referrals, pending rewards, total paid out

Add to `TrunklineSidebar` under Main section and `TrunklineRouter`.

### Avatar Dropdown: Referral CTA

Insert a highlighted row after the Social section (before Account) in both mobile and desktop layouts of `UserButton.tsx`:
- Gradient background (`from-purple-50 to-pink-50`) to stand out
- Gift icon + "Invite Friends, Get $100" text
- On click: navigate to `/connections`

### Connections Hero: Update Copy

In `ConnectionsHeroSection.tsx`:
- Primary CTA: "Invite a Friend, Get $100"
- Add subtitle: "Share your link and earn $100 for every friend who joins"

### Files affected
- **Migration**: Create `beta_referrals` table + trigger on `user_connections` status change
- **Create**: `src/components/trunkline/TrunklineReferralsTab.tsx` — referral management UI
- **Edit**: `src/components/trunkline/TrunklineRouter.tsx` — add `/referrals` route
- **Edit**: `src/components/trunkline/TrunklineSidebar.tsx` — add Referrals nav item
- **Edit**: `src/components/auth/UserButton.tsx` — add referral CTA in both mobile + desktop dropdowns
- **Edit**: `src/components/connections/ConnectionsHeroSection.tsx` — update CTA copy

