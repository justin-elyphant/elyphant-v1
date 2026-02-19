
# Privacy Rules: What's Real, What Needs Work, and What to Change

## Honest Status Before Planning

After reading all the relevant code — the profile display component, the public profile RPC, the birthday utility, the address resolver, and the signup trigger — here is exactly what is and isn't working today.

---

## Your Three Points: Current Reality

### Point 1 — Email & Shipping Address Should NEVER Be Visible, But Gifting Must Still Work

**What's already correct:**
- The `ProfileInfo.tsx` component gates email display behind `data_sharing_settings.email !== 'private'`. If a user sets email to private, it won't show on their profile.
- The shipping address shown on profiles is already limited to city and state only (the `formatAddress()` function in `ProfileInfo.tsx` only outputs city, state, country — never the street). The full address is never rendered in the UI.
- The recipient address privacy standard is enforced in order confirmations: senders only see Name, City, State with a lock icon (confirmed in memory notes).
- The `recipientAddressResolver.ts` service handles the gift-without-connection case correctly: if a shopper finds a non-connected user and tries to buy a gift, the system sends an address request email to that recipient. The purchase flow is NOT blocked — it just routes through a "request address" step. This is the right behavior.

**What needs to change:**
- Right now, the `data_sharing_settings.email` default is set by whatever the user chose during onboarding (can be `friends`, `public`, or `private`). There is no server-level guarantee that email is never sent to another user's browser. If a user sets email to `public`, `ProfileInfo.tsx` will render their email address in plaintext on their public profile. You've decided this should never happen — so email should be permanently removed from the profile display entirely, not controlled by a toggle.
- Similarly, the `data_sharing_settings.shipping_address` toggle exists in the UI and is settable to `public` or `connections`. Even though the display only shows city/state, the toggle implies it's meaningful, which it isn't (the backend already resolves the full address through a separate system). This setting creates confusion without adding value.

**Recommendation:** Remove email and shipping address from `ProfileInfo.tsx` and the `DataSharingSection` UI entirely. They should not be privacy-configurable fields at all — the rules are hardcoded: email = never shown, address = city/state only in social context, full address = backend-only for fulfillment.

---

### Point 2 — Birthday: Show Month/Day, Hide Year (Facebook Pattern)

**What's already correct:**
- The database already stores birthday as two separate fields: `dob` (MM-DD format, month and day only) and `birth_year` (a separate integer column). This architecture was already built for exactly this use case.
- The `formatBirthdayForDisplay()` function already ONLY uses the `dob` field (month/day) and intentionally ignores `birth_year` for display purposes. So "January 15" would already show instead of "January 15, 1990" if you're looking at the birthday display.

**What's missing:**
- The `shouldDisplayBirthday()` function still uses the terminology `'friends'` instead of `'connections'` in its logic (minor cleanup).
- More critically: there is no explanation to users anywhere in the UI about WHY year is separate. During profile setup, users enter a full date — the year gets stored separately and is used for age-gating and AI gift personalization, but this is invisible to users. A small note in the birthday field ("Your birth year is used for personalization but never shown publicly") would eliminate confusion.
- The `data_sharing_settings.dob` privacy control remains meaningful and should stay — users should be able to control whether even their month/day birthday is visible (some people don't want it shown at all).

**Recommendation:** No code change needed for the core birthday display — it already works the Facebook way. Only two things to add: fix the `'friends'` → `'connections'` terminology in `birthdayUtils.ts` and add a helper text note in the birthday input field during setup and in settings.

---

### Point 3 — Default Privacy Settings at Signup: Maximum Sharing, Minimum Friction

**What's set today (from the database trigger):**

| Setting | Current Default | Your Goal |
|---|---|---|
| `profile_visibility` | `public` | `public` ✅ |
| `allow_connection_requests_from` | `everyone` | `everyone` ✅ |
| `allow_message_requests` | `true` | `true` ✅ |
| `show_follower_count` | `true` | `true` ✅ |
| `show_following_count` | `true` | `true` ✅ |
| `wishlist_visibility` | `connections_only` ⚠️ | `public` — needs change |
| `auto_gift_consent` | `connections_only` ⚠️ | debatable — see below |
| `gift_surprise_mode` | `true` | `true` ✅ |
| `data_sharing_settings.dob` | `friends` (set at onboarding) | `connections` — terminology fix |
| `data_sharing_settings.email` | user-set at onboarding | remove from UI entirely |
| `data_sharing_settings.shipping_address` | user-set at onboarding | remove from UI entirely |
| `data_sharing_settings.interests` | user-set at onboarding | `public` — see below |

**The key issue:** `wishlist_visibility` defaults to `connections_only` in the hook's `DEFAULT_SETTINGS`. This means a brand new user's wishlists are only visible to their connections — but they likely have zero connections when they first sign up. This creates a dead state where new users have no public-facing gifting presence. This is the most impactful default to fix.

**For `auto_gift_consent`:** The right default here is `connections_only`, not `everyone`. Auto-gifting means someone can schedule recurring automated purchases charged to their card for you. Even for maximum sharing, allowing random strangers to set up auto-gifts is a trust and spam risk. `connections_only` is the right default here — this is the one control where maximum openness would hurt users.

**For `interests` data sharing:** Interests should default to `public` because they are the primary mechanism for gift discovery and AI recommendations. If a new user's interests are private, Nicole AI can't help shoppers find them good gifts.

---

## What Needs to Change: Implementation Plan

### Change 1 — Database: Fix signup defaults (migration required)
Update the `create_default_privacy_settings` trigger function to set:
- `wishlist_visibility` → `'public'` (was `connections_only` — the hook default)
- Ensure `auto_gift_consent` → `'connections_only'`
- Ensure `gift_surprise_mode` → `true`

The trigger currently doesn't include these 3 new columns at all (they were added in the last migration but the trigger was written before that). New users signing up right now get NULL for all three gifting fields — they fall back to hook defaults which may differ from what the DB should store.

### Change 2 — Remove email & shipping from Data Sharing UI
- Remove email and shipping address rows from `DataSharingSection.tsx` and `DataSharingSectionWrapper.tsx`
- Remove them from the profile setup `DataSharingStep.tsx` and `PrivacyStep.tsx`
- Remove email and shipping_address display blocks from `ProfileInfo.tsx`
- The types in `DataSharingSettings` can retain the fields for backward compatibility but they won't appear in UI

### Change 3 — Fix birthday terminology
- In `birthdayUtils.ts`: rename `'friends'` → `'connections'` in `shouldDisplayBirthday()`
- Add helper text to the birthday field in settings: "Your birth year is stored privately for personalization and is never shown on your profile"

### Change 4 — Default interests to `public` at onboarding
- In profile setup steps (`DataSharingStep.tsx`, `PrivacyStep.tsx`), change the default value for `interests` from `"friends"` to `"public"`
- Update `DEFAULT_SETTINGS` in `ProfileFormData` if applicable

### Change 5 — Wire `wishlist_visibility` enforcement
Since `wishlist_visibility` is now a stored setting, the wishlists shown on a user's public profile page need to actually check this setting. Currently, wishlists are filtered only by `is_public` boolean on individual wishlists. The global `wishlist_visibility` privacy setting needs to gate the entire wishlist section — if set to `connections_only`, non-connections see no wishlists even if individual wishlists have `is_public = true`.

This is important: without this, the setting is stored but silently ignored.

---

## What Does NOT Need to Change

- The address-for-gifting flow is correctly designed — non-connected shoppers trigger an address request instead of being blocked from purchasing. Leave this alone.
- `gift_surprise_mode` enforcement already exists in `EmailTemplateService.ts` (purchaser identity is withheld when anonymous). The `isAnonymous` flag is already passed through. Leave this alone.
- Birthday display already works the Facebook way (month/day only). Leave `formatBirthdayForDisplay` alone except the terminology fix.
- `profile_visibility` and connection request defaults are already correct.

---

## Files to Change

**Database migration:**
- Update `create_default_privacy_settings()` trigger to include `wishlist_visibility = 'public'`, `auto_gift_consent = 'connections_only'`, `gift_surprise_mode = true`
- Backfill existing users who have NULL in these 3 columns

**Frontend:**
- `src/utils/birthdayUtils.ts` — fix `'friends'` → `'connections'` terminology
- `src/components/user-profile/ProfileInfo.tsx` — remove email and shipping address display blocks
- `src/components/settings/DataSharingSection.tsx` — remove email and shipping_address form fields
- `src/components/profile-setup/steps/DataSharingStep.tsx` — remove email and shipping, set interests default to `'public'`
- `src/components/profile-setup/steps/PrivacyStep.tsx` — same as above
- `src/hooks/usePrivacySettings.ts` — update `DEFAULT_SETTINGS.wishlist_visibility` from `'connections_only'` to `'public'`
- `src/components/settings/DataSharingSectionWrapper.tsx` — remove email and shipping fields

**Wishlist enforcement (requires reading the profile/wishlist rendering component):**
- The component that renders wishlists on another user's profile needs to check `wishlist_visibility` from `privacy_settings` and hide the entire section if the viewer doesn't have the right relationship level
