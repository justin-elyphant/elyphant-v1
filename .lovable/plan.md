

## Remove Find Friends Modal, Elevate Invite as Primary CTA

### Concept

Replace the "Find Friends" button in the hero with "Invite a Friend" as the **primary** white CTA — this is the highest-visibility spot on the page and turns every visit into a potential viral moment. The search bar (now handling discovery) makes "Find Friends" redundant, but invite is a distinct action that deserves prominence.

### Changes

**1. Hero section: swap buttons**
- Replace the primary white "Find Friends" button with **"Invite a Friend"** (UserPlus icon) — keeps the high-contrast white-on-purple treatment
- Remove the secondary ghost "Invite New" button (no longer needed as a secondary)
- Update the hero copy from "Build your gifting circle" to something more action-oriented like "Grow your gifting circle — invite friends to discover gifts they'll love"
- Update props: remove `onFindFriends`, make `onInviteNew` the primary action

**2. Search bar: handle discovery**
- As planned: upgrade the search bar placeholder to "Search by name, username, or email..."
- Debounced global search merges results into Suggestions tab
- Email detection shows inline invite CTA

**3. Remove modal triggers**
- Remove `showFindFriendsDialog` state and all `<Dialog>` blocks for EnhancedConnectionSearch in Connections.tsx
- Remove `AddConnectionFAB` (the floating + button) — the hero invite CTA and search bar email-invite cover this
- Clean up `ConnectionsHeader` "Find Friends" button

**4. Keep the share/invite link in the hero**
Add a subtle "Share your invite link" text button below the primary CTA — tapping copies the user's `/invite/{username}` URL or triggers native share on Capacitor. This is a second viral touch that costs zero friction.

### Files affected
- **Edit**: `src/components/connections/ConnectionsHeroSection.tsx` — swap to invite-first CTA, add share link, update copy
- **Edit**: `src/pages/Connections.tsx` — remove modal state/dialogs, add debounced global search, wire invite as primary
- **Edit**: `src/components/connections/ConnectionsHeader.tsx` — remove Find Friends button, update placeholder
- **Keep**: `AddConnectionSheet` (opened by invite CTA), `EnhancedConnectionSearch.tsx` (file stays, just not rendered here)

