
# Privacy System Audit: Analysis & Recommendations

## What You Have Today

Your platform has privacy controls scattered across three separate, disconnected systems. None of them fully "talk" to each other, and they use different terminology, different storage mechanisms, and different enforcement patterns.

---

## The 3 Privacy Systems Currently in Your Codebase

### System 1: Social Privacy (`privacy_settings` database table)
**What it controls:** Profile visibility, connection requests, messaging, follower counts, block lists
**Where it's stored:** Supabase `privacy_settings` table (properly persisted)
**Where it's edited:** Two different places:
- `Settings > Privacy & Sharing` tab (via `PrivacySharingSettings.tsx`)
- `Connections` page (via `PrivacySettings.tsx` — a completely separate, near-identical component)

**Options used:**
- Profile visibility: `public` / `followers_only` / `private`
- Connection requests: `everyone` / `friends_only` / `nobody`
- Message requests: boolean toggle
- Show follower/following count: boolean toggles

### System 2: Data Sharing (`data_sharing_settings` JSONB in `profiles` table)
**What it controls:** Who can see your email, birthday, shipping address, and interests
**Where it's stored:** Inside the `profiles` table as a JSONB column (embedded inside the profile object)
**Where it's edited:** `Settings > Privacy & Sharing` tab, via `DataSharingSectionWrapper` (which spins up a full general settings form just to change 4 fields)

**Options used:**
- Per-field visibility: `private` / `friends` / `public`
- Fields: `dob`, `shipping_address`, `interests`, `email`
- Note: `gift_preferences` is a deprecated duplicate of `interests` still floating around in 51 files

### System 3: Wishlist Privacy (`is_public` boolean on `wishlists` table)
**What it controls:** Whether a wishlist is publicly sharable
**Where it's stored:** `wishlists.is_public` boolean column
**Where it's edited:** Inline on wishlist cards, in a share dialog, in a mobile action bar
**Enforcement:** Checked on the frontend when sharing links — but this is the most correctly scoped of the three systems

---

## The Problems

### Problem 1: Two hooks named `usePrivacySettings` — different things, both exported
- `src/hooks/usePrivacySettings.ts` — reads from the **database** (`privacy_settings` table), used in Settings
- `src/hooks/usePrivacySettings.tsx` — reads from **localStorage** only, never persisted to the database
- The `.tsx` version stores settings in `localStorage` using a totally different shape (`allowFriendRequests`, `connectionVisibility`, `friendSuggestions`) that has **no corresponding database columns**. These settings are silently lost on logout or new device.
- This is a data loss bug: users think they're saving settings, but they aren't.

### Problem 2: `PrivacySharingSettings.tsx` and `PrivacySecuritySettings.tsx` are near-identical
Both files are ~180 lines, render the same social privacy controls (connection requests, profile visibility, message requests, follower counts), use the same hook, and differ by only one section (the data sharing wrapper). One of them is dead code.

### Problem 3: `PrivacySettings.tsx` (in the Connections page) duplicates the Settings page controls
The `connections/PrivacySettings.tsx` component renders the exact same social privacy settings that exist in `Settings > Privacy & Sharing`. Users who change them in one place won't know they exist in the other. This creates confusion about where the "real" privacy settings live.

### Problem 4: Terminology mismatch across the three systems
| Setting | System 1 | System 2 | System 3 |
|---|---|---|---|
| Public visibility | `public` / `followers_only` / `private` | `public` / `friends` / `private` | `is_public` boolean |
| "Friends" concept | `friends_only` | `friends` | N/A |
| Social graph term | "followers" | "friends" | N/A |

Your social graph uses "connections" but your privacy labels say "followers" and "friends" — neither of which is your actual terminology in the app. Users see "Connections" everywhere but privacy settings say "Followers Only."

### Problem 5: Data sharing settings are stored in the wrong place
Storing `data_sharing_settings` as a JSONB blob inside `profiles` means:
- It can't be indexed or queried efficiently
- It gets dragged along in every profile fetch even when irrelevant
- Updating it requires loading the entire general settings form
- The `DataSharingSectionWrapper` creates a full `react-hook-form` instance just to change 4 fields

### Problem 6: `gift_preferences` privacy field is deprecated but still referenced in 51 files
The `gift_preferences` privacy field is marked deprecated in the types and should have been removed, but it's still being read, written, and validated across the codebase. The validator in `dataStructureValidator.ts` even still lists it as a "required field."

### Problem 7: Missing gifting-specific privacy controls
As an e-commerce + social platform, there are key privacy gaps that neither Instagram/Meta nor Amazon have but that Elyphant uniquely needs:
- **Wishlist item visibility from non-connections** — there's no setting for "who can see my wishlist items when browsing my profile"
- **Gift purchase visibility** — when someone buys from a wishlist, can the recipient see who bought it before the gift is delivered?
- **Auto-gift opt-in/out** — can other users set up auto-gifts for you without your permission? There's no consent control in the privacy settings.
- **Shipping address sharing for group gifts** — who within a group gift sees the recipient address?

---

## What Best Practice Looks Like for Your Platform

### From social platforms (Instagram, LinkedIn):
- One unified privacy settings page, not split across multiple routes
- Consistent terminology: pick one word (you should use "Connections") and use it everywhere
- Profile visibility affects what the profile shows, not whether you can be found

### From e-commerce platforms (Amazon, Etsy):
- Per-wishlist privacy toggle (you already have this — it's your strongest implementation)
- Address privacy is locked by default and never shown to other shoppers
- Purchase history is always private

### From gift platforms (The Knot, Zola):
- Separate the concept of "who can see my wishlist" from "who can buy from my wishlist"
- Gift purchaser identity is withheld until after delivery ("surprise mode")
- Explicit opt-in for auto-gifting features (consent controls)

---

## Recommended Consolidation Plan

### Phase 1: Fix the data loss bug (critical)
Delete `src/hooks/usePrivacySettings.tsx` (the localStorage version). The settings it stores (`allowFriendRequests`, `connectionVisibility`, `friendSuggestions`) need to either be added to the `privacy_settings` database table or removed entirely. Users are losing settings on every logout.

### Phase 2: Unify terminology
Rename all occurrences of "followers" and "friends" in privacy settings to "connections" to match your app's own language. Specifically:
- `followers_only` → `connections_only`
- `friends_only` → `connections_only`
- `friends` (in data sharing) → `connections`
- Update labels in all 3 settings components

### Phase 3: Consolidate the UI into one settings page
- Delete `PrivacySecuritySettings.tsx` (dead code)
- Remove `connections/PrivacySettings.tsx` from the Connections page — replace with a "Manage Privacy Settings" link to Settings > Privacy
- Merge `DataSharingSectionWrapper` logic to use the same `usePrivacySettings` hook rather than spinning up a full form

### Phase 4: Migrate `data_sharing_settings` to its own table
Move the 4 data sharing fields out of the `profiles` JSONB blob into the `privacy_settings` table (or a dedicated `data_sharing_settings` table). This lets them be updated independently without loading the full profile form.

### Phase 5: Add gifting-specific privacy controls (competitive differentiator)
Add three controls that no competitor has in this combination:
1. **"Who can set up auto-gifts for me"** — `everyone` / `connections_only` / `nobody` (consent for auto-gifting)
2. **"Show wishlist to"** — per-wishlist granular control beyond just public/private
3. **"Gift surprise mode"** — hide purchaser identity until delivery date

### Phase 6: Clean up `gift_preferences` references
Remove the deprecated `gift_preferences` privacy field from all 51 files that still reference it. The single source of truth is `interests`.

---

## Summary: What to Build vs. What to Fix

| Issue | Severity | Action |
|---|---|---|
| Two `usePrivacySettings` hooks (data loss bug) | Critical | Delete `.tsx` version, migrate settings to DB |
| Terminology: "followers/friends" vs "connections" | High | Rename across all 3 systems |
| Duplicate settings components | Medium | Delete `PrivacySecuritySettings.tsx`, remove from Connections page |
| `data_sharing_settings` in profiles JSONB | Medium | Migrate to `privacy_settings` table |
| Missing auto-gift consent control | Medium | Add to privacy settings |
| `gift_preferences` privacy field still alive | Low | Clean up 51 files |
| Wishlist privacy beyond public/private | Low | Add per-wishlist granular options |

The biggest wins — fewest changes, most impact — are: fix the data loss bug, unify terminology to "connections," and remove the duplicate components.
