

## Fix Photo Step Icon Layout

The camera badge is clipped by `overflow-hidden` on the circular button, making it look cut off and uneven. The fix is to move the camera badge outside the clipping container and adjust positioning so both icons look balanced.

### Changes

**File:** `src/components/auth/stepped/steps/PhotoStep.tsx`

1. Wrap the circular button in a `relative` container div
2. Move the camera badge `div` (line 113-115) outside the `overflow-hidden` button, into the wrapper
3. Adjust badge positioning to sit visibly at the bottom-right of the circle without being clipped

**Before:**
```
<button class="relative ... overflow-hidden">
  <User icon />
  <div class="absolute bottom-0 right-0 ...">  ← clipped by overflow-hidden
    <Camera />
  </div>
</button>
```

**After:**
```
<div class="relative">
  <button class="... overflow-hidden">
    <User icon />
  </button>
  <div class="absolute bottom-1 right-1 ...">  ← outside overflow-hidden, fully visible
    <Camera />
  </div>
</div>
```

This is a small CSS/structure fix — no logic changes.

