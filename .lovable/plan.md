

# Unified Platform Refactoring Plan
## Connections + Gifting + Viral Loops + Address System

This plan replaces ad-hoc gap-patching with a journey-driven refactor. Every change traces back to one of three core user journeys: invited user, organic user, or returning gifter.

---

## Phase 1: Connection System Cleanup (Foundation)
*Everything else depends on a clean, consistent connection layer.*

### 1A. Consolidate Duplicate Hooks
- **Delete** `src/hooks/useConnectionsAdapter.ts` (669-line standalone version with N+1 queries)
- **Keep** `src/hooks/useConnectionsAdapter.tsx` (thin wrapper around `useEnhancedConnections`)
- **Delete** `src/hooks/useConnectionStatus.ts` -- replace all usages with `connectionService.checkConnectionStatus`
- **Delete** `src/hooks/useConnectionRequestDebugger.ts` -- 30-second polling in production is wasteful
- **Delete** `src/hooks/useConnectionById.tsx` -- inline the lookup into consumers
- Update all imports across the codebase (roughly 10-15 files)

### 1B. Unify Realtime Channels
- Consolidate 3 separate Supabase realtime subscriptions on `user_connections` into one in `useRealtimeConnections.ts`
- Remove the dedicated channel in `usePendingConnectionsCount.ts` -- derive count from the unified connection state

### 1C. Standardize Status Values
- Create `src/constants/connectionStatus.ts` with a single enum: `pending`, `pending_invitation`, `accepted`, `rejected`, `blocked`
- Add a validation helper used by every query that filters on status
- Ensures no repeat of the Curt/Jacob bug

### 1D. Fix N+1 in Suggestions
- Create a Supabase RPC function `get_mutual_friends_count(user_a, user_b)` that runs one SQL query instead of 2 round-trips per suggestion
- Update `useConnectionSuggestions` to call it

---

## Phase 2: Simplify Invite Flow (Viral Loop Enabler)

### 2A. Reduce AddConnectionSheet to 3 Fields
- Replace the current 18-field `inviteForm` state in `AddConnectionSheet.tsx` with: **name, email, personal message**
- Remove: phone, address fields, birthday, closenessLevel slider, interactionFrequency, specialConsiderations, sharedInterests
- These fields move to **progressive disclosure** -- collected after the connection is accepted, when the user configures auto-gifting or relationship details
- Keep the collapsible sections architecture but remove them for now

### 2B. Add Shareable Invite Links
- Generate per-user invite URLs: `elyphant.ai/invite/{username}`
- New route `/invite/:username` shows a public profile preview (photo, name, wishlist count) with a "Connect & Sign Up" CTA
- On signup via invite link: store inviter's user ID in `user_metadata`, auto-create pending connection
- Add "Copy my invite link" button to the Connections page header and profile settings
- This bypasses the email-only invite limitation -- users can share via text, DM, social

### 2C. Inline Quick-Invite in Gift Flow
- Add a "Send to someone new" option in `SimpleRecipientSelector` and `BuyNowDrawer`
- Opens a minimal inline form (name + email) that creates a `pending_invitation` connection and proceeds with the order
- Address resolution handled by existing Tier 3 (address request email to recipient)

---

## Phase 3: Address System -- Required But Deferred

### 3A. Make Address Optional in Onboarding
- In `UnifiedOnboarding.tsx`, change the `formSchema` address validation from `.min(1, "required")` to `.optional()`
- Keep the address section visible in the UI with persuasive copy: "Add your address so friends can send you gifts directly"
- Remove the `ensureAddressVerified()` gate that currently blocks step progression
- Users who skip it will hit just-in-time prompts (3B)

### 3B. Build `useAddressGate` Hook + `AddressGateModal`
- **New hook**: `src/hooks/useAddressGate.ts`
  - Checks if user has a verified shipping address (from `profiles.shipping_address` or `user_addresses`)
  - If yes: executes the wrapped action immediately
  - If no: opens `AddressGateModal` with context-specific copy, then executes the action on completion
- **New component**: `src/components/shared/AddressGateModal.tsx`
  - Reuses existing `AddressAutocomplete` + `InlineAddressVerification` components
  - Contextual messaging based on trigger (e.g., "To create a wishlist, add your address so friends can ship gifts to you")
  - On save: updates `profiles.shipping_address` AND creates a `user_addresses` record

### 3C. Gate Trigger Points
Wrap these actions with `useAddressGate`:
- **Creating a wishlist** (`CreateWishlistButton.tsx`)
- **Accepting a connection** (in `useEnhancedConnections` accept handler)
- **Setting up auto-gifting** (in auto-gift configuration flow)
- **Self-delivery checkout** (already gated in `Checkout.tsx`, just improve the error UX)

### 3D. No Changes to Downstream Systems
These stay exactly as-is -- they already handle missing addresses:
- `recipientAddressResolver.ts` (Tier 3 sends address request email)
- `stripe-webhook-v2` (reads address at fulfillment time)
- `UnifiedOrderProcessingService` (validates address at execution)

---

## Phase 4: Gifting + Connection Privacy Enforcement

### 4A. Enforce `auto_gift_consent`
- In `UnifiedGiftManagementService.ts` where auto-gift rules execute, add a check:
  - Query recipient's `privacy_settings.auto_gift_consent`
  - If `nobody`: block execution, notify rule creator
  - If `connections_only`: verify accepted connection exists before proceeding
  - If `everyone`: proceed
- This is a privacy/trust fix -- currently the setting is stored but never checked

### 4B. Enforce `wishlist_visibility` Server-Side
- Create a Supabase RPC function `get_visible_wishlists(viewer_id, owner_id)` that checks:
  - If `public`: return all public wishlists
  - If `connections_only`: verify accepted connection, then return
  - If `private`: return empty unless viewer = owner
- Update wishlist page queries to use this function instead of raw `is_public` checks

### 4C. Standardize Connection ID vs User ID
- Audit `autoGiftPermissionService` and `recipientAddressResolver` for places where `Connection.id` (record ID) is used where `connected_user_id` (user UUID) is expected
- Standardize to always pass the target user's UUID for permission checks

### 4D. Non-Connected Gift Consent Flow
- When someone gifts a user they're not connected to (via inline quick-invite from Phase 2C):
  - Order is created with `status: pending_recipient_consent`
  - Recipient gets an email: "[Name] wants to send you a gift on Elyphant!"
  - Recipient can accept (triggers address collection if needed) or decline
  - If accepted: order proceeds to fulfillment
  - If declined or no response after 14 days: refund sender, notify them

---

## Phase 5: Post-Signup Viral Loops

### 5A. Auto-Connect on Invite Signup
- Move `accept_invitation_by_token` from `Auth.tsx` useEffect to the onboarding completion handler in `UnifiedOnboarding.tsx` where user context is guaranteed
- On success: store the inviter's user ID for routing

### 5B. Wishlist Reveal Moment
- After onboarding, if user signed up via invite: redirect to **inviter's public profile/wishlist** instead of `/wishlists`
- Show CTA: "Now create your own wishlist so [Name] knows what to get you"
- This is the core viral moment -- new user sees value immediately and is prompted to create shareable content

### 5C. Post-Purchase Re-engagement
- After sending a gift, show:
  - "Set up auto-gifting for [Name]'s birthday?" (if birthday is known)
  - "Know someone else who'd love this? Share your invite link"
- After receiving a gift notification:
  - "Thank [Name] and see their wishlist"
  - "Create your own wishlist so friends know what to get you"

### 5D. Address Request Reminder Chain
- When an address request email is sent (Tier 3 in recipientAddressResolver), schedule follow-ups:
  - Day 3: gentle reminder
  - Day 7: "Your friend is waiting to send you something"
  - Day 14: notify sender with options (cancel, provide address, convert to gift card)

---

## Implementation Order & Dependencies

```text
Phase 1 (Foundation)     ──→  Phase 2 (Viral Invite)
       │                              │
       └──→  Phase 3 (Address Gate)   │
                    │                 │
                    └────→  Phase 4 (Privacy Enforcement)
                                      │
                                      └──→  Phase 5 (Viral Loops)
```

- **Phase 1** is prerequisite for everything -- clean connection layer
- **Phases 2 and 3** can run in parallel after Phase 1
- **Phase 4** depends on Phases 2 and 3 (needs simplified invite + address gate in place)
- **Phase 5** depends on all prior phases

### Estimated Scope
| Phase | Files Changed | New Files | Complexity |
|-------|--------------|-----------|------------|
| 1 | ~15 (imports) + 4 deleted | 1 (constants) + 1 (RPC) | Medium |
| 2 | 3 (AddConnectionSheet, SimpleRecipientSelector, BuyNowDrawer) | 1 (invite route) | Medium |
| 3 | 1 (UnifiedOnboarding) | 2 (hook + modal) | Low-Medium |
| 4 | 3 (services) | 2 (RPC functions) | Medium |
| 5 | 3 (Auth, onboarding, post-purchase) | 0 | Low |

