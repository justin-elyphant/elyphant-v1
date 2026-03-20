

## Fix Invite Sheet Scrolling + iOS/Capacitor Polish

### Problem
The desktop Dialog on line 254 of `AddConnectionSheet.tsx` uses `overflow-hidden`, which clips the form content — users can't scroll to reach the message field or send button. The mobile bottom sheet already scrolls correctly via `overflow-y-auto`.

### Production wiring — confirmed working
- `handleSendInvitation` creates a pending connection via `unifiedGiftManagementService.createPendingConnection`
- Fires `connection_invitation` event to `ecommerce-email-orchestrator` with proper sender/recipient data and invitation URL
- Invitation URL uses the real `elyphant.ai` domain with the invitation token
- Analytics tracking via `invitationAnalyticsService` is wired
- Copy invite link generates the correct `/invite/{username}` URL
- No gaps — this is production-ready

### Changes

**1. Fix desktop Dialog scroll** (`AddConnectionSheet.tsx` line 254)
- Change `overflow-hidden` to `overflow-y-auto` on `DialogContent` so the form scrolls when content exceeds viewport height

**2. iOS/Capacitor polish on the form content**
- Add `pb-safe` (safe area bottom padding) to the form container for Capacitor notch handling
- Add `overscroll-contain` to prevent background scroll bleed on iOS
- Ensure the Send button has proper `min-h-[44px]` touch target (currently uses `size="lg"` which is close but not guaranteed)
- Add `touch-action-manipulation` on the form to prevent double-tap zoom

**3. Tablet handling**
- The current breakpoint uses `useIsMobile(768)` — tablets (768-1024px) get the desktop Dialog. Change to use the bottom sheet for tablets too by bumping the breakpoint to `useIsMobile(1024)`, consistent with the Lululemon-style pattern used elsewhere in the app

### Files affected
- **Edit**: `src/components/connections/AddConnectionSheet.tsx` — fix overflow, add iOS safe area, adjust tablet breakpoint

