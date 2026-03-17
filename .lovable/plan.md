

# Live Email Availability Check on the Email Step

## Approach

Add a Gmail-style debounced check that fires ~500ms after the user stops typing a valid email. This requires a small edge function (since Supabase doesn't expose a public "does this email exist" endpoint) and a UI update to `EmailStep.tsx`.

## Edge Function: `check-email-availability`

A lightweight function that uses the Supabase Admin SDK to check `auth.users` for an existing email. Returns `{ available: true/false }`. No JWT required (it only reveals existence, same as the signup endpoint already does).

```
supabase/functions/check-email-availability/index.ts
```

- Accepts `POST { email: string }`
- Validates email format server-side
- Uses `supabase.auth.admin.listUsers({ filter: email })` to check existence
- Returns `{ available: boolean }`
- Includes CORS headers

## UI Changes: `EmailStep.tsx`

- Add a debounced effect (500ms) that triggers when `email` changes and passes format validation
- Show inline states:
  - Checking: subtle spinner next to the input
  - Taken: red text "This email is already registered" + a "Sign in instead" link
  - Available: green checkmark (subtle, like Gmail)
- Block the "Next" button if the email is taken
- No check fires until the email passes the regex (avoids unnecessary calls)

## Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/check-email-availability/index.ts` | New edge function to check email existence via admin API |
| `supabase/config.toml` | Add function config with `verify_jwt = false` |
| `src/components/auth/stepped/steps/EmailStep.tsx` | Add debounced availability check with inline feedback |

