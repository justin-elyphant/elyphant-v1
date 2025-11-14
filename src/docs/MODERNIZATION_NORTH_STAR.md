# 🎯 NORTH STAR: Stripe Checkout Migration Reference

**Purpose**: Quick-reference guide to ensure ALL fixes and features align with the modernization plan.

---

## ✅ Core Principles (Always Follow)

1. **Use Checkout Sessions for ALL payment flows**
   - Replace Payment Intent creation with `create-checkout-session`
   - Stripe hosts the payment UI (PCI compliance handled)

2. **Store ALL order data in Stripe session metadata**
   - No cart_sessions table lookups
   - Metadata includes: items, addresses, scheduled_date, is_auto_gift, rule_id

3. **Webhook is the single source of truth**
   - `checkout.session.completed` creates orders
   - No separate payment verification needed

4. **Idempotent operations**
   - Use `checkout_session_id` as unique identifier
   - Stripe handles duplicate payment prevention

5. **Scheduled deliveries use `capture_method: 'manual'`**
   - Authorize funds now, capture later
   - `scheduled-order-processor` captures on delivery date

6. **Auto-gifts use saved payment methods**
   - `payment_method_id` from `auto_gifting_rules`
   - `confirm: true` to auto-process

7. **Simplified orders table: 68 → 22 columns**
   - Keep: id, user_id, checkout_session_id, status, payment_status, line_items (jsonb), shipping_address (jsonb), scheduled_delivery_date
   - Remove: All cart-related, duplicate payment fields, legacy status columns

8. **8 core functions (delete 85 legacy functions)**
   - create-checkout-session
   - stripe-webhook
   - process-order
   - scheduled-order-processor
   - auto-gift-orchestrator
   - webhook-signature-validator
   - order-monitor
   - admin-order-tools

---

## 🏗️ Architecture Boundaries

### Frontend (`/checkout`, `/cart`)
- ✅ Call `create-checkout-session` with cart items + metadata
- ✅ Redirect user to Stripe hosted checkout
- ✅ Handle success/cancel redirects
- ❌ Never create Payment Intents directly
- ❌ Never manage cart_sessions for order tracking

### Stripe (Hosted Checkout)
- ✅ Handles payment UI, card security, fraud detection
- ✅ Stores ALL order context in session.metadata
- ✅ Sends webhook on completion/expiration

### Webhook (`stripe-webhook`)
- ✅ Receives `checkout.session.completed`
- ✅ Extracts data from session.metadata (no DB lookups)
- ✅ Creates order record with status 'payment_confirmed' or 'scheduled'
- ✅ Invokes `process-order` for immediate orders
- ❌ Never queries cart_sessions
- ❌ Never creates duplicate orders (idempotent by checkout_session_id)

### Edge Functions (8 core)
- ✅ **process-order**: Submits to Zinc, updates order status
- ✅ **scheduled-order-processor**: Captures held payments, processes scheduled orders
- ✅ **auto-gift-orchestrator**: Sends notifications, creates checkout sessions for auto-gifts
- ✅ **order-monitor**: Checks Zinc status, detects stuck orders
- ❌ Never add new payment verification functions
- ❌ Never add cart session management

---

## 🔧 Bug Fix Decision Tree

**Before implementing ANY fix, ask these 4 questions:**

### 1. Does this align with Checkout Sessions architecture?
- ✅ Using session metadata for order data?
- ✅ Webhook creates orders?
- ❌ Creating new Payment Intent flows?
- ❌ Relying on cart_sessions?

### 2. Am I using metadata instead of database lookups?
- ✅ All order context in `session.metadata`?
- ✅ Extracting from webhook payload?
- ❌ Querying cart_sessions during webhook?
- ❌ Storing partial data in multiple tables?

### 3. Am I adding to the 8 core functions or creating legacy patterns?
- ✅ Enhancing existing core function?
- ✅ Simplifying/removing code?
- ❌ Creating new payment verification functions?
- ❌ Adding duplicate order detection?

### 4. Does this simplify or complicate the system?
- ✅ Reducing edge cases?
- ✅ Removing database tables/columns?
- ❌ Adding new status tracking tables?
- ❌ Creating race condition opportunities?

**If ANY answer is ❌, STOP and reconsider the approach.**

---

## 🧪 Testing Quick Reference

### Standard Checkout
```
Frontend → create-checkout-session → Stripe hosted page → 
webhook (checkout.session.completed) → order created (status: payment_confirmed) → 
process-order → Zinc submission
```

### Scheduled Delivery
```
Frontend → create-checkout-session (capture_method: manual, scheduled_date in metadata) → 
Stripe authorizes payment → webhook → order created (status: scheduled) → 
scheduled-order-processor (on delivery date) → capture payment → process-order
```

### Auto-Gift
```
auto-gift-orchestrator (7 days before) → notification sent → user approves → 
create-checkout-session (payment_method_id, confirm: true, is_auto_gift: true) → 
webhook → order created (status: scheduled, auto_gift_rule_id linked) → 
scheduled-order-processor → capture → process-order
```

### Group Gift
```
Frontend → create-checkout-session (capture_method: manual, group_gift_id in metadata) → 
Stripe authorizes payment → webhook → contribution recorded → 
when goal reached → capture all payments → create order → process-order
```

---

## 🚫 Anti-Patterns to Avoid

### ❌ Creating cart_sessions for order tracking
**Why**: Checkout session metadata contains everything
**Instead**: Store all order data in `session.metadata` during checkout session creation

### ❌ Adding new Payment Intent creation endpoints
**Why**: Checkout Sessions replace Payment Intents
**Instead**: Extend `create-checkout-session` to handle new use case

### ❌ Verifying payments outside the webhook
**Why**: Webhook is source of truth, Stripe guarantees delivery
**Instead**: Trust `checkout.session.completed` event

### ❌ Adding columns to orders table without checking Phase 2
**Why**: We're simplifying from 68 → 22 columns
**Instead**: Store flexible data in existing jsonb columns (line_items, shipping_address, gift_options)

### ❌ Creating separate schedulers for each order type
**Why**: One scheduler handles all scheduled orders
**Instead**: Use `scheduled-order-processor` with different metadata flags

### ❌ Building duplicate order detection logic
**Why**: Stripe prevents duplicate payments via checkout_session_id
**Instead**: Use idempotent webhook handling

### ❌ Splitting order processing by source (manual, auto-gift, group)
**Why**: All orders flow through same pipeline
**Instead**: Use metadata flags (is_auto_gift, group_gift_id) to customize behavior within core functions

---

## 📋 Modernization Status Checklist

### Phase 1: Core Payment Flow (Days 1-3)
- [ ] Deploy `create-checkout-session` (replaces create-payment-intent)
- [ ] Deploy `stripe-webhook` (consolidates 3 functions)
- [ ] Deploy `process-order` (simplifies from 1,196 → 250 lines)
- [ ] Deploy `scheduled-order-processor` (consolidates 3 functions)
- [ ] Deploy `auto-gift-orchestrator` (consolidates 4 functions)
- [ ] Deploy remaining 3 core functions
- [ ] Archive 85 legacy functions (DON'T delete yet)

### Phase 2: Database Simplification (Days 4-5)
- [ ] Migrate orders table (68 → 22 columns)
- [ ] Delete 11 tables: cart_sessions, user_carts, payment_intents_cache, etc.
- [ ] Keep 5 core tables: orders, order_items, auto_gifting_rules, payment_methods, order_notes

### Phase 3: Auto-Gifting Integration (Day 6)
- [ ] Update auto-gift flow to use checkout sessions
- [ ] Test 7-day notification → approval → checkout session → webhook → scheduled order

### Phase 4: Scheduled Delivery Integration (Day 6)
- [ ] Update /checkout to support scheduled delivery UI
- [ ] Test authorize → hold → webhook → capture on date → process

### Phase 5: Migration Strategy (Days 7-10)
- [ ] Deploy with feature flag: USE_CHECKOUT_SESSIONS
- [ ] Ramp: 10% → 50% → 100%
- [ ] Disable old functions
- [ ] Drop old tables after 30 days

---

## 🎯 When in Doubt

**Ask yourself**: 
- Does this fix move us TOWARD the 8-function architecture?
- Or does it recreate the 93-function complexity?

**Remember**:
- Checkout Sessions = Single source of truth
- Metadata = All order context
- Webhook = Order creation trigger
- 8 functions = The goal

**If a fix requires:**
- New payment verification → ❌ STOP, use webhook
- New cart tracking → ❌ STOP, use session metadata
- New status table → ❌ STOP, use orders.status + jsonb
- New scheduler → ❌ STOP, extend scheduled-order-processor

---

## 📚 See Full Plan
For complete details, see: `🎯 Modernization Plan: Stripe Checkout Migration with Auto-Gifting Support` (in project knowledge or pinned message)
