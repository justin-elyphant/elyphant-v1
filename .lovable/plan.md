

# Cleanup: Remove Express Checkout, Archive Apple Pay and Group Gifts

## Summary

Remove the orphaned Express Checkout feature entirely, and move Apple Pay and Group Gift components/services to an `src/_archived/` folder so they're preserved but inactive.

---

## What Gets Deleted (Express Checkout)

These files are orphaned (not imported anywhere) and serve no purpose:

| File | Reason |
|------|--------|
| `src/components/marketplace/checkout/ExpressCheckoutButton.tsx` | Orphaned, redundant with Buy Now |
| `src/components/marketplace/checkout/ExpressCheckoutFlow.tsx` | Orphaned, redundant with Buy Now |

---

## What Gets Archived (Moved to `src/_archived/`)

### Apple Pay (1 file -- orphaned, no imports to clean up)

| File | Archive To |
|------|-----------|
| `src/components/payments/ApplePayButton.tsx` | `src/_archived/payments/ApplePayButton.tsx` |

### Group Gifts (9 files -- some have active imports that need cleanup)

| File | Archive To |
|------|-----------|
| `src/components/group-gifts/GroupGiftContributionModal.tsx` | `src/_archived/group-gifts/GroupGiftContributionModal.tsx` |
| `src/components/group-gifts/GroupGiftProgressCard.tsx` | `src/_archived/group-gifts/GroupGiftProgressCard.tsx` |
| `src/components/messaging/GroupGiftProjectCard.tsx` | `src/_archived/messaging/GroupGiftProjectCard.tsx` |
| `src/components/dashboard/GroupGiftAnalytics.tsx` | `src/_archived/dashboard/GroupGiftAnalytics.tsx` |
| `src/components/dashboard/ActiveGroupProjectsWidget.tsx` | `src/_archived/dashboard/ActiveGroupProjectsWidget.tsx` |
| `src/services/groupGiftService.ts` | `src/_archived/services/groupGiftService.ts` |
| `src/services/groupGiftPaymentService.ts` | `src/_archived/services/groupGiftPaymentService.ts` |
| `src/components/mobile/MobileEcommerceFeatures.tsx` | `src/_archived/mobile/MobileEcommerceFeatures.tsx` |

The last one (`MobileEcommerceFeatures`) contains a "Group Buy" button and is also orphaned -- clean to archive.

---

## Active Code That Needs Cleanup (2 files)

These files actively import group gift code and need their group gift sections removed:

### 1. `src/components/messaging/GroupChatInterface.tsx`
- Remove import of `getGroupGiftProjects` and `GroupGiftProject` from groupGiftService
- Remove import of `GroupGiftProjectCard`
- Remove `giftProjects` state variable
- Remove the `getGroupGiftProjects()` call in the `useEffect`
- Remove the "Active Gift Projects" UI section (lines 190-201)

### 2. `src/components/tracking/EnhancedOrderTracking.tsx`
- Remove import of `getTrackingAccess` and `GroupGiftProject` from groupGiftService
- Remove `isGroupGift` and `groupGiftProject` from the interface
- Remove the `getTrackingAccess` call and group gift demo data logic
- Remove coordinator check references

---

## What Stays Untouched

- **Database tables** (`group_gift_projects`, `group_gift_contributions`) -- left in place, no data loss
- **Supabase types** (`integrations/supabase/types.ts`) -- auto-generated, left as-is
- **Notification type** `group_gift` in `NotificationsContext.tsx` -- harmless string enum, leave it
- **Edge functions** related to group gifts -- no changes needed (they just won't be called)

---

## Result After Implementation

**Active purchase flows reduced to 5:**
1. Standard checkout (`/cart` -> `/checkout`)
2. Wishlist purchase (via cart pipeline)
3. Recurring auto-gifts (via `auto-gift-orchestrator`)
4. Buy Now instant/gift purchase (`BuyNowDrawer`)
5. Scheduled gifts (via `UnifiedGiftSchedulingModal`)
