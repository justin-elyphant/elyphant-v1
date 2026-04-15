

## Fix: Beta invite link uses `/profile/` instead of `/invite/`

### Problem
When you tap "Invite Friends, Get $100" from the avatar dropdown, the shared link is `https://elyphant.ai/profile/justin`. This is a profile viewing link -- it does NOT trigger the invite flow (localStorage persistence, auto-connection, referral tracking, $100 credits).

The correct link for beta referrals is `https://elyphant.ai/invite/justin`.

### Root cause
`useProfileSharing` always calls `getProfileUrl()` which returns `/profile/:username`. There is no invite URL variant, and the `isBetaTester` flag only changes the share **text** -- not the **URL**.

### Fix (2 files, minimal changes)

1. **`src/utils/urlUtils.ts`** -- Add a new `getInviteUrl` function:
   ```ts
   export const getInviteUrl = (usernameOrId: string): string => {
     return `${getAppUrl()}/invite/${usernameOrId}`;
   };
   ```

2. **`src/hooks/useProfileSharing.ts`** -- When `isBetaTester` is true, use the invite URL instead of the profile URL:
   ```ts
   import { getProfileUrl, getInviteUrl } from "@/utils/urlUtils";
   // ...
   const profileUrl = isBetaTester
     ? getInviteUrl(profileUsername || profileId)
     : getProfileUrl(profileUsername || profileId);
   ```

This ensures that beta testers' share links go through `/invite/justin`, which triggers the full referral pipeline (localStorage context, auto-connection, `beta_referrals` record, admin approval email, $100 credits).

Non-beta users continue to share `/profile/` links as before.

