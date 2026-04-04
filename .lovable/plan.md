

## Add "Incoming Gifts" Tracking for Platform Recipients

### Problem

Platform recipients get a "gift coming your way" email — but when they log in, there's nothing to see. Orders are only queried by `user_id` (the buyer), so recipients can't view or track gifts sent to them. The email is a dead end.

### Current state

- `stripe-webhook-v2` stores `recipient_id` in each order's `line_items` JSONB (per-item) and calls `sendRecipientGiftNotification` for platform users
- All order queries in the app filter by `.eq('user_id', user.id)` — buyer only
- No "incoming gifts" page, tab, or widget exists
- The `gift_coming_your_way` email template links to the dashboard, but the dashboard shows nothing about incoming gifts

### Solution

**1. Database: Add `recipient_id` column to `orders` table**

Currently, recipient info is buried inside `line_items` JSONB (per-item `recipient_id`). To query efficiently, add a top-level `recipient_id` column:

```sql
ALTER TABLE orders ADD COLUMN recipient_id uuid REFERENCES profiles(id);
CREATE INDEX idx_orders_recipient_id ON orders(recipient_id);
```

Populate it in `stripe-webhook-v2` when creating orders (it already has `group.recipientId` available).

**2. RLS: Allow recipients to read their incoming orders**

Add a SELECT policy so recipients can see orders sent to them:

```sql
CREATE POLICY "Recipients can view their incoming gift orders"
ON orders FOR SELECT TO authenticated
USING (recipient_id = auth.uid());
```

**3. "Incoming Gifts" section on Dashboard**

Add a widget to the StreamlinedDashboard showing gifts where `recipient_id = user.id`:
- Card per incoming gift showing: sender name, order status, tracking timeline (reusing `computeOrderSteps`), estimated delivery
- Gift message displayed if present
- Surprise mode: hide product details if `gift_options.keepSurprise` is true, show only "A gift is on its way!" with sender name and delivery estimate

**4. Order tracking for recipients**

Update `OrderDetail.tsx` to allow access when `recipient_id = user.id` (not just `user_id`). Recipients see the same tracking timeline but with limited info (no pricing, no Zinc internals) — just status steps, carrier, and delivery estimate.

**5. Update `gift_coming_your_way` email CTA**

For existing platform users, the email CTA should link to `/orders/{order_id}` (or a new `/gifts/incoming` route) instead of the generic dashboard.

### Files changed

| File | Change |
|------|--------|
| Migration SQL | Add `recipient_id` column + index + RLS policy |
| `stripe-webhook-v2/index.ts` | Set `recipient_id` on order record at creation time |
| `src/components/dashboard/widgets/IncomingGiftsWidget.tsx` | New widget querying orders by `recipient_id` |
| `src/components/dashboard/StreamlinedDashboard.tsx` | Add IncomingGiftsWidget |
| `src/pages/OrderDetail.tsx` | Allow recipient access with limited view |
| `ecommerce-email-orchestrator/index.ts` | Update platform-user CTA link in `gift_coming_your_way` template |

### What this does NOT change

- Buy Now / checkout flows — untouched
- Non-platform recipient flow (manual address) — already handled separately
- Order data model for buyers — no columns removed
- Gift surprise/privacy logic — recipients see limited info by default

### Technical detail: `recipient_id` population

In `stripe-webhook-v2`, when creating an order from a delivery group, `group.recipientId` is already resolved. The insert just needs:
```
recipient_id: group.recipientId !== userId ? group.recipientId : null
```

For existing historical orders, a one-time backfill migration can extract `recipient_id` from `line_items` JSONB.

