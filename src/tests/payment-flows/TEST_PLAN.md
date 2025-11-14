# Payment Flow End-to-End Test Plan

## Test Environment Setup
- Use Stripe test mode keys
- Test cards: 
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - 3D Secure: `4000 0000 0000 3220`
- Mock Zinc API responses
- Use staging/development Supabase instance

## Test Scenarios

### 1. Standard Checkout Flow ✅
**Path:** Cart → Checkout → Stripe Hosted Checkout → Success Page
**Steps:**
1. Add 2 products to cart (different recipients)
2. Navigate to /checkout
3. Verify shipping addresses loaded
4. Click "Proceed to Checkout" button
5. Verify redirect to Stripe hosted checkout (checkout.stripe.com)
6. Complete payment with test card `4242 4242 4242 4242`
7. Enter expiry: `12/34`, CVC: `123`
8. Verify redirect to /order-success?session_id=...
9. Verify order created in database with correct:
   - Line items
   - Delivery groups
   - Payment status = 'paid'
   - Order status = 'payment_confirmed'
10. Check Stripe Dashboard for payment

**Expected Result:** Order successfully created and processed

**Pass Criteria:**
- ✅ Checkout session created successfully
- ✅ Payment completed without errors
- ✅ Order record created in database
- ✅ All line items match cart
- ✅ Delivery groups preserved
- ✅ Payment status = 'paid'

---

### 2. Apple Pay Checkout ✅
**Path:** Checkout → Apple Pay Button → Payment Sheet → Success
**Prerequisites:** iOS Safari or Mac Safari with Apple Pay configured

**Steps:**
1. Add products to cart (iPhone/Safari only)
2. Navigate to /checkout
3. Verify Apple Pay button visible
4. Click Apple Pay button
5. Verify payment sheet opens with correct amount
6. Complete with Face ID/Touch ID
7. Verify success message
8. Verify order created (same validation as test 1)

**Expected Result:** Order created without redirect to Stripe

**Pass Criteria:**
- ✅ Apple Pay sheet opens
- ✅ Amount matches cart total
- ✅ Payment completes successfully
- ✅ Order created immediately
- ✅ No redirect to Stripe checkout

---

### 3. Scheduled Delivery ✅
**Path:** Checkout → Schedule Date → Payment → Scheduled Status
**Steps:**
1. Add products to cart
2. Navigate to /checkout
3. Enable "Schedule Delivery" toggle
4. Select date picker
5. Choose date 30 days in future
6. Verify summary shows "Scheduled for: [date]"
7. Complete checkout with test card
8. Verify order created with:
   - status = 'scheduled'
   - payment_status = 'authorized' (not captured)
   - scheduled_delivery_date = selected date
9. Check Stripe Dashboard:
   - Payment shows as "Uncaptured"
   - Amount on hold
10. Manually trigger `scheduled-order-processor` edge function
11. Verify payment captured
12. Verify order status = 'processing'

**Expected Result:** Payment held until scheduled date

**Pass Criteria:**
- ✅ Scheduled date saved correctly
- ✅ Payment authorized but not captured
- ✅ Order status = 'scheduled'
- ✅ Processor captures payment on schedule
- ✅ Order status updates to 'processing'

---

### 4. Group Gift Contribution ✅
**Path:** Group Gift Page → Contribute → Checkout → Contribution Recorded
**Prerequisites:** Active group gift project with remaining amount

**Steps:**
1. Navigate to active group gift project page
2. Click "Contribute" button
3. Enter contribution amount ($25)
4. Verify minimum/maximum validation
5. Complete checkout (redirects to Stripe)
6. Complete payment with test card
7. Verify redirect back to project page with success message
8. Verify contribution record created:
   - contribution_status = 'paid'
   - payment held in escrow (capture_method: manual)
   - stripe_payment_intent_id populated
   - committed_amount = $25
9. Verify project current_amount incremented by $25
10. When project goal reached, admin triggers group gift purchase
11. Verify funds captured and order created for recipient

**Expected Result:** Contribution held until project completes

**Pass Criteria:**
- ✅ Checkout session created with group gift metadata
- ✅ Payment completed successfully
- ✅ Contribution record created
- ✅ Payment held with capture_method: manual
- ✅ Project amount updated atomically
- ✅ Funds captured when project completes

---

### 5. Failed Payment Recovery ⚠️
**Path:** Checkout → Failed Payment → Order Status Badge Retry
**Steps:**
1. Add product to cart
2. Complete checkout with declining test card `4000 0000 0000 0002`
3. Verify Stripe shows "Card declined" error
4. Verify graceful error handling (no crash)
5. Try again with valid card `4242 4242 4242 4242`
6. Verify payment succeeds on retry

**Alternative Recovery Path:**
1. Create order that fails payment
2. Navigate to /orders page
3. Find failed order
4. Click "Verify Payment" button on failed order
5. Verify payment verification runs
6. Manually pay via Stripe Dashboard (for testing)
7. Click "Verify Payment" again
8. Verify order status updates to 'payment_confirmed'

**Expected Result:** Failed orders can be retried and recovered

**Pass Criteria:**
- ✅ Error message displayed to user
- ✅ No application crash
- ✅ Retry succeeds with valid card
- ✅ Manual verification updates order status
- ✅ Payment recovery flow works

---

### 6. Webhook Idempotency ⚠️
**Path:** Webhook → Duplicate Event → Single Order
**Prerequisites:** Access to Stripe webhook testing

**Steps:**
1. Complete successful checkout (get session_id)
2. Manually trigger `stripe-webhook-v2` with `checkout.session.completed` event
3. Verify order created
4. Trigger same webhook event again (duplicate)
5. Verify only one order exists (check by checkout_session_id)
6. Check database logs for "Order already exists" message

**Expected Result:** Duplicate webhooks don't create duplicate orders

**Pass Criteria:**
- ✅ First webhook creates order
- ✅ Duplicate webhook skipped
- ✅ No duplicate orders in database
- ✅ Idempotency logged correctly

---

### 7. Auto-Gift Scheduling 🔄
**Path:** Auto-Gift Rule → Notification → Approval → Scheduled Order
**Prerequisites:** Auto-gifting feature enabled, saved payment method

**Steps:**
1. Create auto-gifting rule for recipient (7 days from now)
2. Set budget limit ($50)
3. Configure gift preferences
4. Manually trigger `auto-gift-orchestrator` edge function
5. Verify execution record created with status = 'pending_approval'
6. Verify notification sent to user
7. User approves auto-gift via email link or dashboard
8. Verify checkout session created with:
   - metadata.is_auto_gift = true
   - scheduled_delivery_date = event date
   - payment method attached
9. Verify payment authorized but not captured
10. On event date, trigger `scheduled-order-processor`
11. Verify payment captured
12. Verify order submitted to Zinc
13. Verify order status = 'processing'

**Expected Result:** Auto-gift scheduled and executed on event date

**Pass Criteria:**
- ✅ Rule triggers on schedule
- ✅ Notification sent to user
- ✅ Approval flow works
- ✅ Payment authorized with saved method
- ✅ Order held until event date
- ✅ Automatic processing on event date
- ✅ Zinc order submission succeeds

---

## Manual Testing Checklist

### Pre-Testing Setup
- [ ] Verify Stripe test mode enabled
- [ ] Clear browser cache and localStorage
- [ ] Create test user account
- [ ] Add test products to marketplace
- [ ] Verify test cards work in Stripe
- [ ] Access to Stripe Dashboard

### Browser Testing Matrix
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Network Conditions
- [ ] Fast 3G (throttled)
- [ ] Slow 3G (throttled)
- [ ] Offline (error handling)

### Additional Tests
- [ ] Test with ad blockers enabled
- [ ] Test with privacy mode enabled
- [ ] Test with JavaScript disabled (should show error)
- [ ] Test concurrent checkouts (same user, multiple tabs)

---

## Test Results Tracking

| Test | Status | Date | Tester | Notes |
|------|--------|------|--------|-------|
| Standard Checkout | ⏸️ Pending | | | |
| Apple Pay | ⏸️ Pending | | | |
| Scheduled Delivery | ⏸️ Pending | | | |
| Group Gift | ⏸️ Pending | | | |
| Failed Payment | ⏸️ Pending | | | |
| Webhook Idempotency | ⏸️ Pending | | | |
| Auto-Gift Scheduling | ⏸️ Pending | | | |

---

## Issue Tracking

### Found Issues
Document any issues in GitHub Issues with label `payment-flow-bug`

Example:
```
Title: Group gift checkout redirects to wrong URL
Priority: High
Description: After completing payment, redirects to /group-gift/undefined
Expected: /group-gift/{projectId}?contribution=success
```

---

## Automated Testing (Future)

### Playwright E2E Tests
- [ ] Setup Playwright test framework
- [ ] Mock Stripe test mode API
- [ ] Create reusable test fixtures
- [ ] Automate tests 1-4
- [ ] Add CI/CD integration

### Test Coverage Goals
- Standard checkout: 95%
- Apple Pay: 80% (requires iOS)
- Scheduled delivery: 90%
- Group gifts: 95%

---

**Last Updated:** 2025-01-24  
**Test Plan Version:** v1.0  
**Next Review:** After Phase 4 completion
