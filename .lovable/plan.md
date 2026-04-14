

# Two-Phase Onboarding Fix

## What stays the same
- All onboarding steps remain identical: Name → Email → Password → Birthday → Interests → Address → Photo
- Birthday and shipping address remain **mandatory** (non-skippable steps)
- `complete_onboarding` RPC is still called at the end with all collected data
- The user experience is unchanged — same screens, same order, same validation

## What changes

### 1. Move `supabase.auth.signUp()` to after the Password step
**File:** `src/components/auth/stepped/SteppedAuthFlow.tsx`

- After the user completes the Password step and taps Next, call `signUp()` immediately
- Store the resulting `authData.user` in component state
- The `handle_new_user` trigger fires and creates a minimal profile row (name, email, username, default birth_year)
- If signup fails here, the user gets a clear error on the password screen — not 4 steps later
- The user proceeds to Birthday → Interests → Address → Photo with their account already created

### 2. Move `complete_onboarding` RPC to Photo step (no change)
- The final `handleComplete` function still calls `complete_onboarding` with all collected data (DOB, address, interests, photo)
- But now it references the already-created user ID from state instead of calling `signUp` first
- If this call fails, the account still exists — the user can retry or complete setup later in Settings

### 3. Add localStorage draft persistence
- Save form state to localStorage on each step transition
- On mount, restore any saved draft so the user doesn't re-enter their address 5 times
- Clear the draft on successful completion

### 4. Improve error handling
- Password step: show signup-specific errors (duplicate email, weak password) immediately
- Photo step: if `complete_onboarding` fails, show a retry button instead of losing everything
- No more generic "Database error saving new user" on the photo screen

## Technical details

### SteppedAuthFlow.tsx changes
- New state: `createdUser: User | null`
- `goNext` for the password step becomes async — calls `signUp`, stores user, then advances
- `handleComplete` no longer calls `signUp` — uses `createdUser` from state
- Add `useEffect` to persist/restore `state` from `localStorage`

### No database changes needed
- `handle_new_user` trigger already creates minimal profiles correctly
- `complete_onboarding` RPC already handles upserts
- No new migrations required

## Risk assessment
- **Low risk**: The same two calls (`signUp` + `complete_onboarding`) happen in the same order, just at different step boundaries
- **Rollback**: If issues arise, reverting to the single-phase approach is a one-file change

