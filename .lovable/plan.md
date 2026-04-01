

## Make Avatar Referral CTA Trigger Native Share on Mobile

### Current behavior
Both the mobile and desktop avatar dropdown "Invite Friends, Get $100" CTAs navigate to `/connections`. On mobile, this is friction — the user lands on connections and then has to tap the hero CTA to trigger the share sheet.

### Proposed behavior
- **Mobile**: Avatar dropdown CTA triggers the native share sheet directly (same `quickShare` from `useProfileSharing`), matching the connections hero behavior.
- **Desktop/Tablet**: Keeps navigating to `/connections` (unchanged).

### Technical changes

**`src/components/auth/UserButton.tsx`**

1. Import `useProfileSharing` hook.
2. Initialize it with the existing `profile` data and `isBetaTester` flag (all already available in scope).
3. Create a handler that checks `isMobile`: if mobile, call `quickShare()`; otherwise, `navigate("/connections")`.
4. Update the mobile referral CTA's `onClick` (line 253) to use this handler.
5. Desktop CTA (line 427) stays as `navigate("/connections")`.

No new files. ~10 lines changed total.

