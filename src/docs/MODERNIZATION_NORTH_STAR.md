# 🎯 E-Commerce Modernization: North Star Reference

**Last Updated:** 2025-01-14  
**Purpose:** Single source of truth for payment system architecture decisions

---

## 📊 Current Implementation Status

**Progress:** ████████░░ **80% Complete** (Phases 1, 3, 4 done)  
**🚧 Blocking Issue:** Phase 2 Database Simplification NOT started

### ✅ Phase 1: Core Functions - COMPLETE
- All 8 core edge functions deployed and working
- `create-checkout-session`, `stripe-webhook-v2`, `process-order-v2`
- `scheduled-order-processor`, `auto-gift-orchestrator`, `order-monitor-v2`
- `webhook-signature-validator`, `admin-order-tools`

### 🚧 Phase 2: Database Simplification - NOT STARTED
- **Critical Gap:** `orders` table still has **50+ columns** (target: 22)
- **Legacy Tables:** 11 tables still present (should be deleted)
  - `cart_sessions`, `user_carts`, `payment_intents_cache`
  - `payment_verification_audit`, `order_recovery_logs`
  - `order_status_monitoring`, `scheduled_order_alerts`
  - Plus 4 more legacy payment tables
- **Impact:** Until complete, modifications to orders table are risky

### ✅ Phase 3: Auto-Gifting - COMPLETE
- Auto-gift orchestrator working with Checkout Sessions
- Approval flow, scheduled payment capture functional

### ✅ Phase 4: Scheduled Delivery - COMPLETE
- Manual scheduled delivery from checkout working
- Payment hold/capture on delivery date functional

### 📅 Phase 5: Migration Cleanup - NOT STARTED
- `_v2` suffixes still on function names
- 85 legacy functions still present (need deletion)
- Feature flags not implemented
- Legacy table cleanup pending

---

## 🎯 Immediate Priorities

### Priority 1: Manual Testing (Est: 30-45 min)
**Run all 7 test scenarios from** `src/tests/payment-flows/MANUAL_TESTING.md`
- Standard checkout flow
- Failed payment recovery
- Group gift contribution
- Scheduled delivery
- Auto-gift approval
- Payment method validation
- Webhook idempotency

**Why Critical:** Ensures all 8 core functions work before Phase 2 changes

### Priority 2: Phase 2 Database Simplification (Est: 2-3 days)
**Step 1:** Migrate `orders` table from 50+ columns to 22 core columns  
**Step 2:** Delete 11 legacy tables  
**Step 3:** Update all queries to use new schema  
**Step 4:** Test all payment flows again

**Why Blocking:** Cannot safely delete legacy functions until database is clean

### Priority 3: Frontend Legacy Code Cleanup ✅ COMPLETE
**Phase 5A - UnifiedPaymentService cleanup:**
- ✅ Removed createPaymentIntent() method (~37 lines)
- ✅ Removed processPaymentSuccess() method (~70 lines)
- ✅ Removed useUnifiedPayment hook from useUnifiedPayment.ts (~47 lines)
- ✅ Updated class documentation to reflect Checkout Sessions only
- ✅ Updated protection measures documentation
**Result:** ~154 lines of legacy code removed, zero production risk
**Note:** useUnifiedPayment.ts file retained for useUnifiedCart hook export

### Priority 4: Remove `_v2` Suffixes (Est: 4 hours)
**After Phase 2 complete:**
- Rename all `*-v2` functions to final names
- Update all function references in code
- Deploy and verify

### Priority 5: Delete Legacy Functions (Est: 1 day)
**Delete 85 legacy functions:**
- All old payment intent handlers (create-payment-intent-v2, etc.)
- All cart session managers
- All duplicate order detectors
- All manual schedulers

---

## 📋 Current Function Inventory

### ✅ Core Functions (8) - Keep These
1. `create-checkout-session` - Entry point for ALL payments
2. `stripe-webhook-v2` - Single source of truth (checkout.session.completed)
3. `process-order-v2` - Zinc API submission
4. `scheduled-order-processor` - Daily cron for scheduled deliveries
5. `auto-gift-orchestrator` - Daily cron for auto-gifts
6. `order-monitor-v2` - Order status tracking
7. `webhook-signature-validator` - Security validation
8. `admin-order-tools` - Manual admin operations

### ⚠️ Legacy Functions (~85) - Delete After Phase 2
- `create-payment-intent` and all variants
- `verify-payment-intent`, `verify-checkout-session`
- `process-zma-order` (1,196 lines!)
- `process-scheduled-orders`, `capture-scheduled-payment`
- All cart session managers
- All duplicate order detectors
- All payment verification/recovery functions
- All split/simple processors
- *(Full list: search supabase/functions/ for functions NOT in core 8)*

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

## 🚨 Bug Fix Decision Tree

**Before fixing ANY payment-related bug, ask these questions in order:**

### Question 1: Is Phase 2 Database Cleanup Complete?
- **NO** → Do NOT modify `orders` table structure
- **NO** → Do NOT add new columns to `orders`
- **NO** → Use metadata/jsonb fields for new data
- **YES** → Proceed to Question 2

### Question 2: Does this use Checkout Sessions?
- ✅ Using `create-checkout-session` for payment entry?
- ✅ Webhook (`stripe-webhook-v2`) creates orders?
- ❌ Creating new Payment Intent flows?
- ❌ Relying on `cart_sessions` table?

### Question 3: Am I Using the Right Function?
- ✅ Using one of the 8 core functions?
- ✅ Enhancing existing core function, not creating new one?
- ❌ Creating new payment verification function?
- ❌ Creating new cart session manager?

### Question 4: Is data in session metadata?
- ✅ All order context stored in `session.metadata`?
- ✅ Webhook extracts from payload (no DB lookups)?
- ❌ Querying `cart_sessions` during webhook?
- ❌ Storing partial data in multiple tables?

### Question 5: Is the webhook idempotent?
- ✅ Using `checkout_session_id` as unique identifier?
- ✅ Checking for existing order before creation?
- ❌ Creating duplicate orders possible?
- ❌ Race conditions between webhook calls?

### Question 6: Will this work for all payment types?
- ✅ Standard checkout works?
- ✅ Scheduled delivery works?
- ✅ Auto-gift works?
- ✅ Group gift works?
- ❌ Only works for one payment type?

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
