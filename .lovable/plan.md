

## Privacy Policy Analysis: Calibration Assessment

### Summary of All 13 Privacy Controls

| # | Setting | Default | Enforced? | Assessment |
|---|---------|---------|-----------|------------|
| 1 | `profile_visibility` | **public** | Yes (search + public profiles) | Appropriate |
| 2 | `allow_connection_requests_from` | **everyone** | Yes (search service) | Appropriate |
| 3 | `allow_message_requests` | **true** | Yes (public profile service) | Appropriate |
| 4 | `wishlist_visibility` | **public** | Yes (gift service + wishlist grid) | Appropriate |
| 5 | `auto_gift_consent` | **connections_only** | Yes (gift management service) | Appropriate |
| 6 | `gift_surprise_mode` | **true** | **Not enforced** | Dead setting |
| 7 | `block_list_visibility` | **hidden** | **Not enforced** | Dead setting |
| 8 | `show_follower_count` | **true** | **UI only, not enforced on public profiles** | Weak |
| 9 | `show_following_count` | **true** | **Not enforced anywhere** | Dead setting |
| 10 | `dob_visibility` | **friends** | Yes (birthday utils + connections adapter) | Appropriate |
| 11 | `shipping_address_visibility` | **private** | Yes (connections adapter) | Appropriate |
| 12 | `interests_visibility` | **public** | Partially (indicator only, not gated) | Weak |
| 13 | `email_visibility` | **friends** | Yes (profile banner + compact header) | Appropriate |

---

### Issues Found

**1. Three Dead Settings (stored but never enforced)**

- **`gift_surprise_mode`** -- Togglable in Settings UI, saved to DB, but no code anywhere checks this value to hide the gift sender's identity. It's a promise to the user that isn't kept.
- **`block_list_visibility`** -- Saved to DB but never read by any component or service. There's no UI that shows a user's block list to connections regardless of this setting.
- **`show_following_count`** -- In the DB and hook but not in the Settings UI and not enforced on any profile view. The Settings UI only shows `show_follower_count` (labeled "Show connection count"). This is a vestigial field from a follower/following model that no longer exists -- the platform uses symmetric connections.

**Recommendation**: Delete all three. They add complexity, give users false confidence, and increase the settings surface for no benefit.

**2. Two Weak Enforcement Settings**

- **`show_follower_count`** -- The Settings UI lets users toggle this, but `publicProfileService.ts` always returns `connection_count` to any viewer. The toggle is only checked in `PrivacySharingSettings.tsx` (the settings page itself), not on the actual profile views (`InstagramProfileLayout`, `CompactProfileHeader`, `ProfileBanner`). A user who turns this off still has their count visible to everyone.

- **`interests_visibility`** -- Saved and shown as a privacy badge via `PrivacyIndicator`, but no code actually gates whether interests/gift preferences are visible to non-friends. Profile views render interests regardless of this setting. The indicator tells users their interests are "Friends Only" while displaying them publicly.

**Recommendation**: Either enforce these properly (check the setting before rendering the data) or remove the toggle to avoid misleading users.

**3. Default Calibration Issues**

- **`interests_visibility` defaults to `public`** -- This is intentional per the "maximum sharing" strategy for AI gift recommendations. However, combined with the fact it's not enforced, changing the default wouldn't matter until enforcement is added. No action needed on the default itself.

- **`email_visibility` defaults to `friends`** -- Good. The memory docs say emails should never be rendered in UI, so this setting is somewhat redundant with the hardcoded rule. But having it as a belt-and-suspenders approach is fine.

- No defaults are too conservative for a social gifting platform. The "maximum sharing" defaults (public profile, public wishlists, public interests) are appropriate for discoverability.

---

### Recommended Changes

**Step 1 -- Remove 3 dead settings**
- Delete `gift_surprise_mode`, `block_list_visibility`, `show_following_count` from:
  - `PrivacySettings` interface in `usePrivacySettings.ts`
  - `DEFAULT_SETTINGS` object
  - `normalizeSettings()` function
  - Settings UI (`PrivacySharingSettings.tsx` -- remove the gift surprise toggle and block list card)
- DB migration to drop columns (or leave them and stop reading/writing)

**Step 2 -- Enforce `show_follower_count`**
- In `InstagramProfileLayout`, `CompactProfileHeader`, and `ProfileBanner`: fetch or pass `show_follower_count` and conditionally hide the connection count
- In `publicProfileService.ts`: conditionally omit `connection_count` based on the setting

**Step 3 -- Enforce `interests_visibility`**
- In profile views that render interests/gift preferences: check `interests_visibility` against viewer relationship before rendering
- This aligns the `PrivacyIndicator` badge with actual behavior

**Step 4 -- DB migration** (optional cleanup)
- Drop `gift_surprise_mode`, `block_list_visibility`, `show_following_count` columns
- Update the `create_default_privacy_settings` trigger to stop setting them

### Impact
- Removes 3 settings that do nothing (reduces user confusion)
- Fixes 2 settings that lie to users (badge says "Friends Only" but data is public)
- No changes to defaults or settings that are working correctly
- Net reduction: 13 settings to 10, all properly enforced

