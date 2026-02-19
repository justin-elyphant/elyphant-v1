
# Privacy Compliance Gaps: What Can Be Built in Lovable

Here is an honest assessment of each gap, what already exists, what's missing, and what needs to be built.

---

## Gap 1 — Cookie / Tracking Consent Banner

**Current state:** Zero. No cookie banner exists anywhere in the codebase. The privacy policy mentions cookies but there is no UI mechanism to collect or record consent.

**What to build:**
A persistent cookie consent banner that appears at the bottom of the screen for first-time visitors. It presents three choices: Accept All, Essential Only, and Customize. The user's selection is stored in `localStorage` so it doesn't reappear on subsequent visits.

This is a frontend-only component — it does not require a database table because cookie consent is a browser-level preference. There is no need to store it server-side for an app where users are already authenticated (Supabase handles essential session cookies; we are not running ad tracking or third-party analytics).

**Files to create:**
- `src/components/legal/CookieConsentBanner.tsx` — the banner UI with Accept All / Essential Only / Customize options
- `src/hooks/useCookieConsent.ts` — hook to read/write consent to localStorage

**Files to modify:**
- `src/App.tsx` — mount the banner at the root level so it appears on every page before login

---

## Gap 2 — Data Export (Right to Portability)

**Current state:** The privacy policy explicitly promises "Portability: Export your data in a machine-readable format" but no such feature exists in settings. `NotificationSettings.tsx` saves to localStorage only — nothing is persisted to the database. The `email_preferences` table exists but only has one row type in use (`profile_completion_reminders`).

**What to build:**
A "Download My Data" button in Settings → Privacy & Sharing. When clicked, it:
1. Fetches the user's profile, interests, wishlists, important dates, orders, connections, and privacy settings from Supabase
2. Compiles them into a structured JSON file
3. Triggers a browser download

This can be done entirely in the frontend using existing Supabase queries — no edge function or backend work is required. The data is already accessible through RLS-protected queries using the user's session token.

**Files to create:**
- `src/utils/dataExportUtils.ts` — functions to gather all user data from the DB and format it for download
- `src/components/settings/DataExportSection.tsx` — UI card with download button, description, and loading state

**Files to modify:**
- `src/components/settings/PrivacySharingSettings.tsx` — add the `DataExportSection` card below the existing sections

---

## Gap 3 — Marketing Email Preferences Persisted to DB

**Current state:** `NotificationSettings.tsx` saves everything to `localStorage` only. This means if a user opts out of marketing emails on one device, that preference is lost on another device and is completely invisible to any backend email-sending system. The `email_preferences` table exists in the DB but is only used for one internal email type.

**What to build:**
Migrate `NotificationSettings.tsx` from localStorage to the `email_preferences` table in Supabase. The email types to track:

| Preference | email_type key |
|---|---|
| Marketing / Special Offers | `marketing` |
| Order Updates | `order_updates` |
| Gift Reminders | `gift_reminders` |
| Friend/Connection Requests | `connection_requests` |
| New Messages | `new_messages` |

When the user saves, the component upserts rows into `email_preferences` per type. The email-sending edge functions (`ecommerce-email-orchestrator`) should check this table before sending any non-transactional email.

**Files to modify:**
- `src/components/settings/NotificationSettings.tsx` — replace localStorage reads/writes with Supabase queries to `email_preferences`
- The existing `email_preferences` table already has the right schema (`user_id`, `email_type`, `is_enabled`, `frequency`) — no migration required

---

## Gap 4 — "Last Updated" Date on Privacy Policy

**Current state:** The privacy policy page has `Last Updated: {new Date().toLocaleDateString()}` which uses the current date dynamically. This means the "last updated" date changes every day even if the policy hasn't changed — which is legally misleading and looks unprofessional.

**What to build:**
Replace the dynamic `new Date()` call with a hardcoded date constant that only changes when the policy is actually updated. This is a one-line change.

**File to modify:**
- `src/pages/PrivacyPolicy.tsx` — change line 9 from `new Date().toLocaleDateString()` to a static string like `"February 19, 2026"`

Same fix applies to `src/pages/TermsOfService.tsx` if it has the same pattern.

---

## Implementation Order

All four gaps can be built in a single session. Recommended order:

1. Privacy Policy "Last Updated" fix (30 seconds, zero risk)
2. Cookie Consent Banner (new component, no DB changes)
3. Notification preferences persisted to DB (touches one existing component)
4. Data Export section (new utility + new UI card in settings)

---

## What Is NOT Being Built (and Why)

**One-click unsubscribe in emails:** The email footer in `emailNotificationService.ts` already has placeholder `<a href="#">Unsubscribe</a>` links that go nowhere. Making these functional requires a public (unauthenticated) unsubscribe endpoint — an edge function that accepts a signed token and marks the user's email preference as disabled. This is technically sound but adds backend complexity. It is the right thing to do for CAN-SPAM compliance and can be built as a follow-up.

**Server-side cookie consent logging:** Storing cookie consent server-side only matters if you run third-party tracking (Google Analytics, Meta Pixel, etc.). Since this app does not currently run any third-party tracking scripts, localStorage is sufficient for cookie consent. If tracking is added later, this should be revisited.

---

## Files Touched Summary

| File | Action |
|---|---|
| `src/components/legal/CookieConsentBanner.tsx` | Create |
| `src/hooks/useCookieConsent.ts` | Create |
| `src/utils/dataExportUtils.ts` | Create |
| `src/components/settings/DataExportSection.tsx` | Create |
| `src/App.tsx` | Add CookieConsentBanner at root |
| `src/components/settings/NotificationSettings.tsx` | Migrate localStorage → DB |
| `src/components/settings/PrivacySharingSettings.tsx` | Add DataExportSection |
| `src/pages/PrivacyPolicy.tsx` | Fix hardcoded last-updated date |
| `src/pages/TermsOfService.tsx` | Same fix if applicable |

No database migrations are required — `email_preferences` already has the right schema.
