

## Fix: Expand Header Search to Discover New People

### Problem
The header search bar's "People" section only shows existing accepted connections. It queries `user_connections` where `status = 'accepted'` and filters profiles from that set, so users you're NOT connected with never appear in results.

### Solution
Replace the manual connection-only query in `UnifiedSearchBar.tsx` with the existing `searchFriendsWithPrivacy` service, which already searches ALL profiles (respecting privacy settings) and returns connection status (connected, pending, or none). Then update the People results section to show a "Connect" button for non-connected users.

### Technical Changes

**File: `src/components/search/unified/UnifiedSearchBar.tsx`**

1. Import `searchFriendsWithPrivacy` and `sendConnectionRequest` from existing services
2. Replace the `ConnectionResult` interface with `FilteredProfile` from the privacy-aware search
3. Replace the connection search logic (lines 106-159) that queries only accepted connections with a call to `searchFriendsWithPrivacy(query, user.id)` -- this already handles:
   - Searching by name and username across ALL profiles
   - Privacy filtering (blocked users, private profiles)
   - Returning `connectionStatus` as `'connected' | 'pending' | 'none'`
4. Update the People results section (lines 373-407) to:
   - Show a "Connected" badge for existing connections
   - Show a "Pending" badge for pending requests
   - Show a "Connect" button (with UserPlus icon) for non-connected users
   - Keep the existing "View Profile" tap behavior on the name/avatar area
5. Add a `handleSendConnectionRequest` function that calls `sendConnectionRequest` and updates local state to show "Pending" immediately

### User Experience After Fix
- Type a name in the header search bar
- "People" section shows ALL matching users on the platform (not just your connections)
- Each result shows their connection status: Connected (green badge), Pending (amber badge), or a Connect button
- Tapping "Connect" sends a request and updates to "Pending" inline
- Tapping the person's name/avatar navigates to their profile (same as current behavior)

