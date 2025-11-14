# Manual Testing Guide for Payment Flows

## Prerequisites

### Environment Setup
- **Staging URL:** Your development environment URL
- **Stripe Test Mode:** Enabled (check for "TEST MODE" badge in dashboard)
- **Test User Account:** Created with verified email
- **Test Products:** At least 3 products in marketplace
- **Test Cards:**
  ```
  Success: 4242 4242 4242 4242 (Exp: 12/34, CVC: 123)
  Decline: 4000 0000 0000 0002 (Exp: 12/34, CVC: 123)
  3D Secure: 4000 0000 0000 3220 (Exp: 12/34, CVC: 123)
  ```

### Before Each Test
1. Clear browser cache and localStorage:
   ```javascript
   // In browser console:
   localStorage.clear();
   location.reload();
   ```
2. Log in as test user
3. Verify Stripe test mode badge visible
4. Clear any existing cart items

---

## Test 1: Standard Checkout Flow

**Time:** 5-7 minutes  
**Complexity:** Low

### Steps

1. ✅ **Navigate to Marketplace**
   - Go to `/marketplace`
   - Verify products load correctly

2. ✅ **Add Products to Cart**
   - Add "Wireless Headphones" ($49.99) to cart
   - Add "Coffee Mug" ($12.99) to cart
   - Click cart icon (top right)
   - Verify 2 items in cart

3. ✅ **Assign Recipients**
   - Click "View Cart"
   - Assign headphones to "John Doe" (connection)
   - Assign mug to "Self"
   - Verify assignments saved

4. ✅ **Proceed to Checkout**
   - Click "Proceed to Checkout" button
   - Verify redirect to `/checkout`

5. ✅ **Review Checkout Page**
   - Verify shipping addresses displayed
   - Verify subtotal = $62.98
   - Verify shipping cost calculated
   - Verify gifting fee displayed (15%)
   - Verify total amount correct

6. ✅ **Complete Checkout**
   - Click "Proceed to Checkout" button
   - **CRITICAL:** Should redirect to `checkout.stripe.com`
   - Verify products listed in Stripe checkout
   - Verify amounts match

7. ✅ **Enter Payment Details**
   - Card number: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - Email: Your test email
   - Click "Pay"

8. ✅ **Verify Success**
   - Should redirect to `/order-success?session_id=...`
   - Verify order confirmation message
   - Verify order number displayed

9. ✅ **Check Order in Dashboard**
   - Navigate to `/orders`
   - Verify order appears
   - Verify status = "Processing" or "Payment Confirmed"
   - Click order to view details
   - Verify all line items correct

10. ✅ **Check Stripe Dashboard**
    - Open Stripe Dashboard → Payments
    - Find payment by session_id
    - Verify status = "Succeeded"
    - Verify amount matches
    - Verify metadata contains order info

### Pass Criteria
- ✅ No errors or crashes at any step
- ✅ Redirect to Stripe checkout works
- ✅ Payment completes successfully
- ✅ Order created in database
- ✅ All amounts match cart totals
- ✅ Stripe payment record matches

### Common Issues
- **Issue:** "Shipping cost not loading"  
  **Fix:** Check network tab for failed API calls
  
- **Issue:** "Checkout button disabled"  
  **Fix:** Verify all required fields filled

---

## Test 2: Failed Payment Recovery

**Time:** 3-4 minutes  
**Complexity:** Low

### Steps

1. ✅ **Setup Cart**
   - Add product to cart
   - Proceed to checkout

2. ✅ **Use Declining Card**
   - At Stripe checkout, use card: `4000 0000 0000 0002`
   - Expiry: `12/34`, CVC: `123`
   - Click "Pay"

3. ✅ **Verify Error Handling**
   - Should show "Your card was declined" message
   - Verify no application crash
   - Verify user can try again

4. ✅ **Retry with Valid Card**
   - Enter valid card: `4242 4242 4242 4242`
   - Expiry: `12/34`, CVC: `123`
   - Click "Pay"

5. ✅ **Verify Success**
   - Payment should succeed
   - Verify redirect to success page
   - Verify order created

### Pass Criteria
- ✅ Error message displayed clearly
- ✅ No application crash
- ✅ Retry works immediately
- ✅ Valid card succeeds

---

## Test 3: Scheduled Delivery

**Time:** 5-6 minutes  
**Complexity:** Medium

### Steps

1. ✅ **Setup Cart**
   - Add products to cart
   - Navigate to `/checkout`

2. ✅ **Enable Scheduled Delivery**
   - Find "Schedule Delivery" toggle
   - Click to enable
   - Verify date picker appears

3. ✅ **Select Future Date**
   - Click date picker
   - Select date 30 days in future
   - Verify date displays in summary
   - Verify text shows "Scheduled for: [date]"

4. ✅ **Complete Checkout**
   - Click "Proceed to Checkout"
   - Complete Stripe payment
   - Verify redirect to success page

5. ✅ **Verify Order Status**
   - Navigate to `/orders`
   - Find the order
   - Verify status = "Scheduled"
   - Verify scheduled date displayed
   - Verify "Processing on: [date]" message

6. ✅ **Check Stripe Dashboard**
   - Open Stripe Dashboard → Payments
   - Find the payment
   - Verify status = "Uncaptured"
   - Verify "Capture method: manual"
   - Verify amount shows as "on hold"

7. ✅ **Test Processor (Optional - Admin only)**
   - Trigger `scheduled-order-processor` edge function
   - Verify payment captured
   - Verify order status updates to "Processing"

### Pass Criteria
- ✅ Scheduled date saved correctly
- ✅ Order status = "Scheduled"
- ✅ Payment authorized but not captured
- ✅ Stripe shows payment on hold
- ✅ Processor captures when triggered

---

## Test 4: Apple Pay (iOS/Mac Only)

**Time:** 3-4 minutes  
**Complexity:** Low  
**Prerequisites:** iOS Safari or Mac Safari with Apple Pay configured

### Steps

1. ✅ **Setup Cart**
   - On iPhone/iPad with Safari, add products to cart
   - Navigate to `/checkout`

2. ✅ **Verify Apple Pay Button**
   - Look for black "Apple Pay" button
   - If not visible, verify device supports Apple Pay
   - Verify button enabled (not grayed out)

3. ✅ **Click Apple Pay**
   - Tap Apple Pay button
   - Verify payment sheet slides up
   - Verify amount matches cart total
   - Verify shipping address displayed

4. ✅ **Complete Payment**
   - Use Face ID, Touch ID, or passcode
   - Verify "Payment Successful" message
   - Verify no redirect to Stripe

5. ✅ **Verify Order Created**
   - Check success message on page
   - Navigate to `/orders`
   - Verify order created
   - Verify status = "Payment Confirmed"

### Pass Criteria
- ✅ Apple Pay button visible
- ✅ Payment sheet opens correctly
- ✅ Amount matches cart
- ✅ Biometric auth works
- ✅ Order created immediately
- ✅ No redirect to Stripe

### Common Issues
- **Issue:** "Apple Pay button not visible"  
  **Fix:** Verify Apple Pay configured on device

---

## Test 5: Group Gift Contribution

**Time:** 6-7 minutes  
**Complexity:** Medium  
**Prerequisites:** Active group gift project with remaining amount

### Steps

1. ✅ **Navigate to Group Gift**
   - Go to active group gift project page
   - Verify project details displayed
   - Verify current amount / goal amount shown
   - Verify "Contribute" button visible

2. ✅ **Click Contribute**
   - Click "Contribute" button
   - Verify modal opens

3. ✅ **Enter Contribution Amount**
   - Try entering $3 (below minimum)
   - Verify error: "Minimum contribution is $5"
   - Enter $25 (valid amount)
   - Verify amount accepted

4. ✅ **Complete Checkout**
   - Click "Contribute" button in modal
   - Verify redirect to Stripe checkout
   - Verify amount = $25
   - Verify description mentions group gift

5. ✅ **Complete Payment**
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: `12/34`, CVC: `123`
   - Click "Pay"

6. ✅ **Verify Success**
   - Should redirect back to project page
   - Verify success message displayed
   - Verify project current_amount increased by $25
   - Verify your contribution listed

7. ✅ **Check Database (Optional - Admin)**
   - Query `group_gift_contributions` table
   - Verify record created with:
     - contribution_status = 'paid'
     - committed_amount = 25
     - stripe_payment_intent_id populated

8. ✅ **Check Stripe Dashboard**
   - Find payment by session_id
   - Verify capture_method = "manual"
   - Verify status = "Uncaptured" (escrowed)
   - Verify metadata.is_group_gift = "true"

### Pass Criteria
- ✅ Validation works (min $5)
- ✅ Checkout session created
- ✅ Payment completes successfully
- ✅ Contribution recorded
- ✅ Payment held in escrow
- ✅ Project amount updated atomically

---

## Results Tracking

### Test Execution Log

| Test | Pass/Fail | Date | Tester | Time Taken | Issues Found |
|------|-----------|------|--------|------------|--------------|
| Standard Checkout | ⏸️ | | | | |
| Failed Payment | ⏸️ | | | | |
| Scheduled Delivery | ⏸️ | | | | |
| Apple Pay | ⏸️ | | | | |
| Group Gift | ⏸️ | | | | |

### Issue Template

When you find an issue, document it like this:

```
**Issue #1: [Brief Description]**
- Test: Standard Checkout
- Severity: High / Medium / Low
- Steps to Reproduce:
  1. Step 1
  2. Step 2
  3. Step 3
- Expected: What should happen
- Actual: What actually happened
- Screenshots: [Attach if applicable]
- Browser: Chrome 120.0
- Date Found: 2025-01-24
```

---

## Tips for Effective Testing

### Best Practices
1. **Test in Order:** Follow tests in sequence (easier to harder)
2. **Take Notes:** Document anything unexpected
3. **Screenshot Errors:** Visual proof helps debugging
4. **Check Network Tab:** Look for failed API calls
5. **Clear Cache:** Between tests to avoid stale data

### Debugging Tools
- **Browser Console:** Check for JavaScript errors
- **Network Tab:** Monitor API calls
- **Stripe Dashboard:** Verify payment events
- **Supabase Dashboard:** Check database records

### When to Stop
- If you find a **critical bug** (payment fails, data loss)
- If the same issue occurs 3 times in a row
- If you can't complete a basic flow

---

## Post-Testing

### After All Tests Complete
1. Export test results to spreadsheet
2. Create GitHub issues for bugs found
3. Update TEST_PLAN.md with results
4. Notify team of completion
5. Schedule regression testing

---

**Last Updated:** 2025-01-24  
**Guide Version:** v1.0  
**Next Update:** After feedback from first round of testing
