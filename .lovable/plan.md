

## Enhance "Find New Connections" with Social Discovery Patterns

### Current gaps vs. social media UX

The search works, but the experience is purely transactional — type a name, see results, hit Connect. Modern social platforms (Instagram, LinkedIn, Snapchat) do three things differently:

1. **Show content before the user searches** — "People you may know" suggestions based on mutual connections or shared interests
2. **Show social proof on each result** — mutual friends count, location, shared wishlists
3. **Share/invite when no results found** — a dead-end empty state loses users; social apps pivot to "Invite them"

### Changes

**1. Pre-search state: "Suggested for you" section**
When the search input is empty, show a short list of suggested people instead of a blank screen. Source: query profiles that share mutual connections with the current user (friends-of-friends not yet connected). Display as a horizontal scroll of avatar cards (Instagram "Discover People" pattern) with name + mutual count + Connect button.

- Add a new RPC function `get_suggested_connections` that finds friends-of-friends
- Render 4-6 suggestion cards in a horizontal scroll above the search results area

**2. Mutual connections badge on search results**
The `mutualConnections` field exists in `FriendSearchResult` but is hardcoded to `0`. Implement the actual count:
- Update `searchFriendsWithPrivacy` to calculate mutual connections per result (count of shared accepted connections between current user and each result)
- Display as "N mutual friends" subtitle below username when > 0

**3. Location context on results**
The `city` and `state` fields are already fetched but never rendered. Show them as a subtle line (e.g., "San Francisco, CA") below the bio — helps users confirm they have the right person.

**4. Empty state → Invite pivot**
When search returns 0 results, replace the dead-end "No users found" with:
- The current message, plus a CTA: "Invite [searchTerm] to Elyphant" that opens the existing `AddConnectionSheet` with the search term pre-filled as the name/email

**5. Share profile link**
Add a small share icon on each result row. Tapping it copies the user's invite link (`/invite/{username}`) or opens the native share sheet on Capacitor — leveraging the existing viral invitation strategy.

### Files affected
- **Create**: SQL migration — `get_suggested_connections` RPC (friends-of-friends query)
- **Edit**: `src/services/search/privacyAwareFriendSearch.ts` — implement mutual connections count
- **Edit**: `src/components/connections/EnhancedConnectionSearch.tsx` — add suggested section, mutual friends display, location line, invite pivot empty state, share button
- **Edit**: `src/pages/Connections.tsx` — pass `onInvite` callback to open AddConnectionSheet from search

### What stays unchanged
- All privacy filtering, blocked user logic, connection request flow
- The Drawer/Dialog swap and Lululemon styling from the previous plan (applied separately)

