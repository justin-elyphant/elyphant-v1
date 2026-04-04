

## Hide Schedule Delivery for Guest Users

### Problem
The "Schedule Delivery" card on `/checkout` is shown to all users, including guests. Scheduled deliveries use `capture_method: manual` — funds are authorized but not captured until T-7 before the arrival date. For guests:
- No account to receive status updates or manage the order
- No saved payment method for potential re-authorization if the hold expires
- No notification channel for delivery confirmations
- Creates a confusing experience for a one-time buyer

### Fix
In `src/components/checkout/UnifiedCheckoutForm.tsx` (~line 817-822), wrap the `ScheduleDeliveryCard` in a `user` check so only authenticated users see it.

### Change

**`src/components/checkout/UnifiedCheckoutForm.tsx`** (line 817-822)

Before:
```tsx
{/* Schedule Delivery - Applies to all items in the order */}
<ScheduleDeliveryCard ... />
```

After:
```tsx
{/* Schedule Delivery - Only for authenticated users (scheduled orders require account for hold management) */}
{user && (
  <ScheduleDeliveryCard ... />
)}
```

### What stays unchanged
- Authenticated user scheduling — fully intact
- Guest inline address form, phone collection — untouched
- Wishlist purchase flow — untouched
- Stripe webhook, fulfillment pipeline — untouched
- `ScheduleDeliveryCard` component itself — no changes

### Scope
1 file, 1 conditional wrap.

