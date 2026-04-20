

## Fix Mobile Connection Card: Broken Message/Gift + Phantom Swipe Indicators

### Problem Summary
On mobile (and tablet), connection cards on the Connections page have two bugs:

1. **Phantom red/green bars**: Touching any card flashes a red bar (left) and green bar (right) — these are swipe-action backgrounds that get rendered on every `touchstart`, regardless of whether the user actually swipes.
2. **Message & Gift do nothing**: The action buttons in the expanded mobile card only call `console.log()` — they never navigate to `/messages/:id` or open the gift flow. Same applies to Accept/Decline (Pending) and Connect (Suggestion) buttons.

Desktop is unaffected because it uses `FriendCard.tsx`, which already routes correctly to `/messages/:id` and opens the `GiftIntentModal`.

### Root Cause
File: `src/components/connections/OptimizedMobileConnectionCard.tsx`

- `handleTouchStart` flips `isTracking=true` → CSS `.connection-swipe-actions.left/.right` (red & green gradients in `connections-mobile.css`) become visible on a simple tap.
- `handleActionTap` only logs the action; no navigation, no modal, no mutation.

### Fix Plan

**1. Remove the broken swipe affordance entirely**
The current swipe code never actually swipes — it only paints the backgrounds. Since `onSwipeLeft`/`onSwipeRight` props are never passed by `Connections.tsx`, this is dead UI clutter. Remove:
- `isTracking` state, `handleTouchStart`, `handleTouchEnd`
- The two `<div className="connection-swipe-actions ...">` blocks
- `swipe-actions` / `swipeable` class names from the card

(Leave the CSS in `connections-mobile.css` alone — harmless, no longer triggered. Or optionally delete the unused swipe rules in a follow-up.)

**2. Wire up the action buttons** (mirror desktop `FriendCard` behavior)
- **Message** → `useNavigate()` to `/messages/${connection.id}`
- **Gift** → open `GiftIntentModal` (same component used by `FriendCard`) with `connection` and `onIntentSelect` handler that routes to:
  - `ai-gift` → `/marketplace?giftFor=${id}&mode=nicole`
  - `marketplace-browse` → `/marketplace?giftFor=${id}`
  - `quick-ideas` → `/marketplace?giftFor=${id}&mode=quick`
- **Accept / Decline** (pending) → call the existing connection-action handlers via props (add `onAccept`/`onDecline` callbacks) and have `Connections.tsx` pass them in (it already has these handlers for the desktop path).
- **Connect** (suggestion) → same pattern: add `onConnect` prop, wire from parent.
- **MoreHorizontal** → keep existing `onRelationshipEdit?.()`.

**3. Stop button taps from toggling card expansion**
Each action button already calls `e.stopPropagation()` — keep that. Also stop propagation on the modal trigger so the card doesn't collapse mid-tap.

**4. Verify across breakpoints**
- Mobile (390px): tap Message → navigates; tap Gift → modal opens; no red/green flash.
- Tablet (820px): same card is used (`useIsMobile` covers <768; tablet may use desktop `FriendCard` — confirm during impl which component renders at 768–1024 and apply the same fix to whichever path shows the bug).
- Desktop (≥1024): `FriendCard` already works — no change.

### Files to Edit
- `src/components/connections/OptimizedMobileConnectionCard.tsx` — remove swipe UI, wire navigation + modal, add new props.
- `src/pages/Connections.tsx` — pass `onAccept`, `onDecline`, `onConnect` props to the mobile card (reuse existing handlers already defined for desktop).

### Out of Scope
- Re-implementing real swipe-to-message/swipe-to-gift gestures (can be a follow-up if desired).
- Visual redesign of the mobile card.

