

## Fix: Replace native date input with dropdown selects in BirthdayStep

### Problem
The native `<input type="date">` is unreliable on mobile browsers and automation tools, causing the "Continue" button to stay disabled during onboarding.

### Data integrity assurance
The birthday write-back to `/settings` is fully preserved:
- `complete_onboarding` RPC receives `p_dob` (MM-DD) and `p_birth_year` (integer) -- both derived from the `YYYY-MM-DD` string
- The dropdown replacement produces the exact same `YYYY-MM-DD` string format
- No changes needed to `SteppedAuthFlow.tsx`, `complete_onboarding` RPC, or settings form

### Changes

**File: `src/components/auth/stepped/steps/BirthdayStep.tsx`**
- Remove the native `<Input type="date">` element
- Add three `<select>` dropdowns: Month (January-December), Day (1-31, adjusted for month), Year (current year down to 1920)
- Compose `YYYY-MM-DD` string from selections and call existing `onChange` callback
- Keep "Why do we need this?" accordion and existing validation logic
- Style with `h-12 rounded-lg` to match existing design system

No other files require changes.

