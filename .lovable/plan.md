
Fix plan (reuse-first, no overengineering)

1) Confirmed root causes from current code
- `PhotoStep` only triggers a hidden `<input type="file">`, so desktop will always open OS attachment folders (exactly what your screenshot shows).
- `PhotoStep` uploads to `avatars/profile-photos/...`, but existing storage policies expect `avatars/profile-images/{userId}/...`.
- In email signup flow, photo upload currently happens before account creation/auth is complete, so storage insert is prone to fail.

2) Implementation approach
- Reuse existing `CameraCapture` component already used in settings/profile bubble.
- Keep one simple fallback file picker for “Choose from device”.
- Move photo upload responsibility to `SteppedAuthFlow` (final submit), where we have a user id and can follow existing backend storage conventions.

3) File-by-file plan

A) `src/components/auth/stepped/steps/PhotoStep.tsx`
- Remove direct Supabase upload from this step.
- Add camera capture UX using existing `CameraCapture`:
  - Primary avatar/camera action opens camera modal (desktop/tablet/mobile with webcam permissions).
  - Secondary action opens hidden file input (gallery/files fallback).
- Validate file type/size here, then pass selected file + preview URL to parent state.
- Keep current visual style and “Change photo” behavior.

B) `src/components/auth/stepped/SteppedAuthFlow.tsx`
- Extend form state to track:
  - `photoFile: File | null`
  - `photoPreviewUrl: string` (for UI preview only)
- Add one helper (inside this file) to upload avatar using existing path convention:
  - bucket: `avatars`
  - path: `profile-images/${userId}/profile-${Date.now()}.${ext}`
- On final submit:
  - OAuth flow: if `photoFile` exists, upload first, then pass uploaded public URL to `complete_onboarding`.
  - Email flow: create account first, then upload (using new user id), then call `complete_onboarding` with final photo URL.
- If upload fails, show a clear toast and continue signup (non-blocking), so onboarding completion is never stuck.

4) Why this matches your request
- Reuses existing camera component and existing avatars bucket/path rules.
- Avoids new backend migrations/functions.
- Fixes desktop “attachment folders only” by adding real in-app camera capture.
- Fixes “photo not saved” by aligning upload path and timing with current backend policy model.

5) Validation checklist after implementation
- Desktop: clicking photo opens camera modal (not immediate file picker), and captured image is saved.
- Desktop fallback: “Choose from device” still opens file picker and saves.
- Mobile Chrome: camera capture + gallery both work and persist.
- Both signup paths (Google OAuth + email/password) save profile image into `avatars/profile-images/{userId}/...`.
