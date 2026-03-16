

# Fix: 4 Onboarding Regressions

## Issues & Root Causes

### 1. Google Places API — 3 missing edge functions
The client calls `get-google-maps-key`, `google-places-autocomplete`, and `google-place-details` edge functions — **none exist**. The `GOOGLE_MAPS_API_KEY` secret is configured. Need to create all three.

### 2. Phone number formatting
Plain `<input type="tel">` with no formatting. Simple fix.

### 3. Photo camera on mobile
The file input lacks `capture="user"`. Simple fix.

### 4. Onboarding data not saving (most critical)
DB shows most test users have `dob: nil`, `name: nil`, `onboarding_completed: false` — the `complete_onboarding` RPC **never succeeded** for them. Root cause: `state.birthday` can be empty string → `new Date("").getFullYear()` returns `NaN` → RPC gets `NaN` for `p_birth_year` (expects INT) → **RPC fails silently**. Also, when birthday IS provided as `YYYY-MM-DD`, the settings mapper (`createBirthdayImportantDate`) parses it as `MM-DD`, producing garbage dates.

---

## Changes

### Create 3 edge functions

**`supabase/functions/get-google-maps-key/index.ts`** — Returns `GOOGLE_MAPS_API_KEY` from env. Simple GET endpoint with CORS.

**`supabase/functions/google-places-autocomplete/index.ts`** — POST endpoint that proxies to `https://maps.googleapis.com/maps/api/place/autocomplete/json` using the secret key.

**`supabase/functions/google-place-details/index.ts`** — POST endpoint that proxies to `https://maps.googleapis.com/maps/api/place/details/json` using the secret key.

All three: CORS headers, `verify_jwt = false` in config.toml.

### Fix `SteppedAuthFlow.tsx` — birthday normalization + guard

```
// Before sending to RPC, normalize birthday
const dobFormatted = state.birthday 
  ? state.birthday.slice(5)  // "YYYY-MM-DD" → "MM-DD"
  : null;
const birthYear = state.birthday 
  ? parseInt(state.birthday.slice(0, 4)) 
  : null;
```

Pass `dobFormatted` as `p_dob` and `birthYear` as `p_birth_year`. This prevents `NaN` from crashing the RPC.

### Fix `profileDataMapper.ts` — handle YYYY-MM-DD dob format

In `mapDatabaseToSettingsForm`, update the DOB parsing to also handle `YYYY-MM-DD`:
```
if (profile.dob && profile.dob.length === 10) {
  // YYYY-MM-DD format
  dateOfBirth = new Date(profile.dob);
}
```
Same for `createBirthdayImportantDate` — detect format length and parse accordingly.

Also add fallback: if `interests` is empty, extract categories from `gift_preferences`.

### Fix `ShippingAddressForm.tsx` — phone formatting

Add `formatPhoneNumber` helper that formats digits as `(XXX) XXX-XXXX` on input change.

### Fix `PhotoStep.tsx` — camera option

Add `capture="user"` to the existing file input so mobile devices offer the camera. No need for a second input — `accept="image/*" capture="user"` gives camera-first with gallery fallback on most devices.

### Update `supabase/config.toml`

Add entries for the 3 new edge functions with `verify_jwt = false`.

---

## Files

| Action | File |
|--------|------|
| Create | `supabase/functions/get-google-maps-key/index.ts` |
| Create | `supabase/functions/google-places-autocomplete/index.ts` |
| Create | `supabase/functions/google-place-details/index.ts` |
| Edit | `supabase/config.toml` — add 3 function entries |
| Edit | `src/components/auth/stepped/SteppedAuthFlow.tsx` — normalize birthday |
| Edit | `src/utils/profileDataMapper.ts` — robust DOB + interests fallback |
| Edit | `src/components/profile-setup/steps/shipping-address/ShippingAddressForm.tsx` — phone format |
| Edit | `src/components/auth/stepped/steps/PhotoStep.tsx` — add capture="user" |

