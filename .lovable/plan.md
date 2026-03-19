

# Fix Profile Photo Step: Camera + Upload on All Platforms

## Root Cause

Two issues:

1. **`capture="user"` forces camera-only** — On Android/Chrome this bypasses the native "Camera or Gallery" chooser, and on desktop it has no camera so behaves unpredictably. Removing it lets the OS show its native picker (camera + gallery on mobile, file picker on desktop).

2. **Wrong storage bucket** — PhotoStep uploads to `profile_photos` which doesn't exist. The rest of the app uses the `avatars` bucket (already created with proper RLS policies in existing migrations). This causes a silent upload failure.

## Changes

### File: `src/components/auth/stepped/steps/PhotoStep.tsx`

1. **Remove `capture="user"`** from the `<input>` — lets the OS provide native camera-or-gallery choice on both iOS and Android (Google Pixel included), and a normal file picker on desktop
2. **Change bucket from `profile_photos` to `avatars`** — reuse the existing bucket that all other profile image code uses
3. **Change upload path** to match existing convention: `profile-images/{userId}/{filename}` (requires passing user ID, or use the simpler `{timestamp}-{random}.{ext}` pattern already used elsewhere in the avatars bucket)
4. **Add `toast.error`** on upload failure so the user gets feedback
5. **Reset `input.value`** after selection so the same file can be re-selected

No new migrations or edge functions needed — this reuses existing infrastructure.

| What | Detail |
|------|--------|
| File changed | `src/components/auth/stepped/steps/PhotoStep.tsx` |
| Bucket | `avatars` (existing, public, with RLS) |
| `capture` attr | Removed entirely |
| Error handling | `toast.error` added |

