

## Referral Cap System with Global Program Budget

### Overview
Two-layer cap system:
1. **Per-user cap**: Each tester gets 2 invite shares (justin@elyphant.com unlimited). Admins can grant more.
2. **Global program cap**: 25 total $100 credits across the entire program. Once hit, no new approvals until you reload the pool from Trunkline.

### Database Changes (1 migration)

**New table: `beta_invite_limits`**
- `user_id` (uuid, PK, FK to auth.users)
- `bonus_invites` (integer, default 0)
- `created_at`, `updated_at`

**New table: `beta_program_settings`**
- Single-row config table
- `id` (integer, default 1, PK)
- `total_credit_pool` (integer, default 25) -- max number of $100 credits
- `updated_at`
- Seeded with 1 row: pool = 25

**New RPC: `get_remaining_invites(p_user_id)`**
- Returns `(2 + bonus_invites) - used_referrals_count`
- Returns -1 for justin@elyphant.com (unlimited)

**Update `approve_beta_referral`** to check global cap:
- Count existing `credit_issued` referrals
- Compare against `beta_program_settings.total_credit_pool`
- If at cap, return error: "Program credit pool exhausted"
- This is the enforcement point -- approval is blocked, not signup

### Frontend Changes (4 files)

**1. New hook: `src/hooks/useRemainingInvites.ts`**
- Calls `get_remaining_invites` RPC
- Returns `{ remaining, isUnlimited, isLoading }`

**2. `src/components/connections/AddConnectionSheet.tsx`**
- Show remaining invites count
- Disable share/invite buttons when remaining <= 0
- Message: "You've used all your invites"
- Skip for unlimited users

**3. `src/pages/AuthCallback.tsx`**
- Before creating `beta_referrals` record, check referrer's remaining invites
- If exhausted, skip referral creation and log warning

**4. `src/components/trunkline/TrunklineReferralsTab.tsx`**
- Show global pool status: "X / 25 credits issued"
- "Grant Invites" button per user (upserts `bonus_invites`)
- "Reload Pool" button to increase `total_credit_pool` (input for new total)
- Disable "Approve" button when pool is exhausted, with message

### How it works end-to-end
- Testers can share up to 2 links each (UI enforced + backend enforced)
- New signups still create `pending_approval` referrals
- When you click Approve in Trunkline, the DB function checks global pool before issuing credit
- Once 25 credits issued, Approve buttons show "Pool exhausted" -- you click "Reload Pool" to add more
- justin@elyphant.com has unlimited invites but credits still count against the global pool

