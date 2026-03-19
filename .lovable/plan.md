
## Goal
Polish the onboarding camera/photo UX so:
1) camera action buttons sit clearly below the viewer (not on top of it), and  
2) the captured photo immediately appears in the profile avatar bubble.

## What I found
- `PhotoStep` preview uses `URL.createObjectURL(...)` (blob URLs).
- Your CSP in `index.html` currently allows `img-src 'self' data: https:` but **not** `blob:`, so blob previews can fail and show broken-image/alt text.
- `CameraCapture` layout is close, but the action row needs a stricter structure to always render as a separate footer area from the viewer.

## Implementation plan

### 1) Fix camera control placement in `CameraCapture`
**File:** `src/components/ui/camera-capture.tsx`

- Refactor dialog body to a strict vertical layout:
  - Header
  - Viewer block (camera/image)
  - Action bar block (capture / retake / use)
- Ensure action bar is visually separated from the viewer:
  - add top border/background or spacing (`border-t`, `pt-*`, `mt-*`)
  - avoid any visual overlap by using normal document flow (no overlay positioning for controls)
- Tighten dialog overflow behavior (`overflow-hidden` on content + internal spacing) so controls don’t collapse into the viewer region on desktop/tablet.

### 2) Make onboarding photo preview CSP-safe (no blob URLs)
**File:** `src/components/auth/stepped/steps/PhotoStep.tsx`

- Replace blob preview URLs with **data URLs** for in-step preview:
  - file picker: convert `File` to data URL before `onChange`
  - camera capture: convert captured `Blob` to data URL before `onChange`
- Keep `onPhotoFile(file)` unchanged so final upload flow still uses the existing deferred upload logic in `SteppedAuthFlow`.
- Add robust fallback handling:
  - if conversion fails, show toast and keep prior preview
  - add `onError` fallback on `<img>` so broken-image text never appears in avatar bubble.

### 3) Keep backend flow unchanged (reuse existing logic)
**File:** no backend/migration changes

- Reuse current deferred upload in `SteppedAuthFlow` (`avatars` bucket + `profile-images/{userId}/...`).
- Do **not** add new storage buckets, policies, or edge functions.

## Technical details (concise)
- Add a small helper in `PhotoStep`:
  - `blobToDataUrl(blob: Blob): Promise<string>`
- Use this helper in both `handleFileChange` and `handleCameraCapture`.
- In `CameraCapture`, structure controls in a dedicated footer container (`flex-col`, `gap-0`, footer `shrink-0`) to prevent overlay-like rendering.

## Validation checklist after implementation
1. Desktop/tablet: “Take Photo” opens camera; capture/retake/use controls are clearly below viewer.
2. After clicking “Use Photo,” the avatar bubble in PhotoStep immediately shows the captured image.
3. “Choose from device” still works and updates preview.
4. Finish onboarding still saves image successfully via existing `SteppedAuthFlow` upload path.
