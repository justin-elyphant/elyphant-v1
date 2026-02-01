# Recurring Gift End-to-End Test Checklist

**Test Case**: Charles Meeks → Justin Meeks (Christmas 2026)  
**Date**: February 2026  
**Expected Gift**: Zevo Flying Insect Trap ($45 from Justin's wishlist)

---

## Pre-Test Setup Verification

### Step 0.1: Verify User Connection
**Action**: Query database to confirm connection exists

```sql
SELECT 
  uc.id as connection_id,
  uc.user_id as charles_id,
  uc.connected_user_id as justin_id,
  uc.status,
  p1.name as charles_name,
  p2.name as justin_name
FROM user_connections uc
JOIN profiles p1 ON uc.user_id = p1.id
JOIN profiles p2 ON uc.connected_user_id = p2.id
WHERE p1.name ILIKE '%charles%' AND p2.name ILIKE '%justin%';
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| status | 'accepted' |
| charles_name | 'Charles Meeks' |
| justin_name | 'Justin Meeks' |

**❌ If Failed**: Connection must exist and be accepted before proceeding.

---

### Step 0.2: Verify Justin's Wishlist Item
**Action**: Query wishlist for the expected product

```sql
SELECT 
  w.id as wishlist_id,
  wi.id as item_id,
  wi.product_id,
  wi.title,
  wi.price,
  wi.image_url,
  p.name as owner_name
FROM wishlists w
JOIN wishlist_items wi ON w.id = wi.wishlist_id
JOIN profiles p ON w.user_id = p.id
WHERE p.name ILIKE '%justin%';
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| title | Contains 'Zevo' or 'Insect Trap' |
| price | ~$45.00 |
| owner_name | 'Justin Meeks' |

**❌ If Failed**: Add item to Justin's wishlist before proceeding.

---

### Step 0.3: Verify Justin's Shipping Address
**Action**: Query for verified shipping address

```sql
SELECT 
  id, user_id, name, address_line1, city, state, postal_code, is_default
FROM shipping_addresses
WHERE user_id = (SELECT id FROM profiles WHERE name ILIKE '%justin%')
  AND is_default = true;
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| is_default | true |
| address_line1 | Non-null, valid address |
| postal_code | Valid US ZIP |

**❌ If Failed**: Justin must have a default shipping address.

---

### Step 0.4: Verify Charles Has Payment Method
**Action**: Query saved payment methods

```sql
SELECT 
  pm.id,
  pm.user_id,
  pm.stripe_payment_method_id,
  pm.card_last_four,
  pm.is_default,
  pm.status
FROM payment_methods pm
JOIN profiles p ON pm.user_id = p.id
WHERE p.name ILIKE '%charles%'
  AND pm.status = 'active';
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| stripe_payment_method_id | pm_xxx... |
| is_default | true |
| status | 'active' |

**⚠️ If Missing**: Charles will need to add a payment method during Step 1.

---

## Phase 1: Rule Creation via AutoGiftSetupFlow

### Step 1.1: Navigate to /recurring-gifts
**Action**: Charles logs in and visits `/recurring-gifts`

**UI Verification**:
- [ ] Hero section displays "Set Up Recurring Gift" button
- [ ] Button is visible and clickable

---

### Step 1.2: Open Setup Modal
**Action**: Click "Set Up Recurring Gift" button

**UI Verification**:
- [ ] `AutoGiftSetupFlow` modal opens
- [ ] Step 1 (Recipient & Events) is displayed
- [ ] Justin Meeks appears in recipient dropdown

---

### Step 1.3: Complete Step 1 - Recipient & Events
**Action**: 
1. Select "Justin Meeks" as recipient
2. Select "Christmas" as the occasion
3. Click "Next"

**UI Verification**:
- [ ] Justin is selected with checkmark
- [ ] Christmas shows as selected event type
- [ ] "Next" button enables

---

### Step 1.4: Complete Step 2 - Budget & Payment
**Action**:
1. Set budget to $50 (covers $45 item + tax/shipping buffer)
2. Select or add payment method
3. Toggle "Auto-approve" OFF (for testing approval flow)
4. Click "Next"

**UI Verification**:
- [ ] Budget slider/input shows $50
- [ ] Payment method card displayed (or add new flow completes)
- [ ] Auto-approve toggle is OFF

---

### Step 1.5: Complete Step 3 - Notifications
**Action**:
1. Keep default notification settings (7 days before)
2. Click "Create Recurring Gift"

**UI Verification**:
- [ ] Success toast appears
- [ ] Modal closes
- [ ] New rule appears in the rules list

---

### Step 1.6: Verify Database State After Rule Creation
**Action**: Query auto_gifting_rules table

```sql
SELECT 
  agr.id as rule_id,
  agr.user_id,
  agr.recipient_id,
  agr.date_type,
  agr.budget_limit,
  agr.is_active,
  agr.payment_method_id,
  agr.gift_selection_criteria,
  agr.notification_preferences,
  p_sender.name as sender_name,
  p_recipient.name as recipient_name
FROM auto_gifting_rules agr
JOIN profiles p_sender ON agr.user_id = p_sender.id
LEFT JOIN profiles p_recipient ON agr.recipient_id = p_recipient.id
WHERE p_sender.name ILIKE '%charles%'
ORDER BY agr.created_at DESC
LIMIT 1;
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| date_type | 'christmas' |
| budget_limit | 50.00 |
| is_active | true |
| payment_method_id | NOT NULL (pm_xxx reference) |
| recipient_name | 'Justin Meeks' |
| gift_selection_criteria | Contains source: 'wishlist' |

**📝 Record**: `rule_id` = ______________________

**❌ If Failed - Rollback**:
```sql
-- Delete the malformed rule
DELETE FROM auto_gifting_rules WHERE id = 'RULE_ID_HERE';
```

---

## Phase 2: Simulate T-7 Notification (Orchestrator)

### Step 2.1: Open Trunkline Admin
**Action**: Navigate to `/trunkline` → "Auto-Gift Testing" tab

**UI Verification**:
- [ ] Auto-Gift Testing tab is visible
- [ ] "Run Orchestrator" section displays
- [ ] Simulated Date input is available

---

### Step 2.2: Run Orchestrator at T-7 (Notification Stage)
**Action**: 
1. Set simulated date to `2026-12-18` (7 days before Christmas)
2. Click "Run Orchestrator"

**Expected Behavior**:
- Orchestrator identifies Charles's Christmas rule
- Sends notification email to Charles
- Does NOT create order yet (T-7 is notification only)

---

### Step 2.3: Verify Notification Created
**Action**: Query auto_gift_notifications table

```sql
SELECT 
  agn.id,
  agn.user_id,
  agn.notification_type,
  agn.title,
  agn.message,
  agn.email_sent,
  agn.created_at
FROM auto_gift_notifications agn
JOIN profiles p ON agn.user_id = p.id
WHERE p.name ILIKE '%charles%'
ORDER BY agn.created_at DESC
LIMIT 1;
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| notification_type | 'upcoming_gift' or 'approval_required' |
| email_sent | true |

---

### Step 2.4: Verify Approval Token Created
**Action**: Query email_approval_tokens table

```sql
SELECT 
  eat.id as token_id,
  eat.user_id,
  eat.execution_id,
  eat.token,
  eat.expires_at,
  eat.approved_at,
  eat.rejected_at
FROM email_approval_tokens eat
JOIN profiles p ON eat.user_id = p.id
WHERE p.name ILIKE '%charles%'
ORDER BY eat.created_at DESC
LIMIT 1;
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| execution_id | NOT NULL |
| approved_at | NULL (not yet approved) |
| rejected_at | NULL |
| expires_at | Future date |

**📝 Record**: `token_id` = ______________________
**📝 Record**: `execution_id` = ______________________

---

## Phase 3: Simulate Approval (Manual or Auto)

### Step 3.1: Approve the Gift
**Option A - Manual Approval via Email Link**:
1. Find the approval URL from the token
2. Visit the URL as Charles
3. Click "Approve"

**Option B - Direct Database Approval (for testing)**:
```sql
UPDATE email_approval_tokens 
SET approved_at = NOW(), approved_via = 'manual_test'
WHERE id = 'TOKEN_ID_HERE';

UPDATE automated_gift_executions 
SET status = 'approved'
WHERE id = 'EXECUTION_ID_HERE';
```

---

### Step 3.2: Verify Execution Status Updated
**Action**: Query automated_gift_executions

```sql
SELECT 
  age.id,
  age.user_id,
  age.rule_id,
  age.status,
  age.selected_products,
  age.total_amount,
  age.order_id,
  age.execution_date
FROM automated_gift_executions age
WHERE age.id = 'EXECUTION_ID_HERE';
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| status | 'approved' |
| selected_products | Contains Zevo product |
| total_amount | ~$45.00 |
| order_id | NULL (not yet created) |

---

## Phase 4: Simulate T-4 Purchase (Orchestrator)

### Step 4.1: Run Orchestrator at T-4 (Purchase Stage)
**Action**: 
1. Set simulated date to `2026-12-21` (4 days before Christmas)
2. Click "Run Orchestrator"

**Expected Behavior**:
- Orchestrator finds approved execution
- Selects Zevo product from Justin's wishlist
- Creates checkout session with saved payment method
- Creates order in 'pending_payment' or 'scheduled' status

---

### Step 4.2: Verify Order Created
**Action**: Query orders table

```sql
SELECT 
  o.id as order_id,
  o.order_number,
  o.user_id,
  o.status,
  o.payment_status,
  o.total_amount,
  o.scheduled_delivery_date,
  o.is_gift,
  o.gift_message,
  o.shipping_address,
  o.stripe_payment_intent_id,
  o.payment_method_id
FROM orders o
JOIN profiles p ON o.user_id = p.id
WHERE p.name ILIKE '%charles%'
ORDER BY o.created_at DESC
LIMIT 1;
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| status | 'scheduled' or 'pending_payment' |
| total_amount | ~$45.00 + tax |
| scheduled_delivery_date | 2026-12-25 |
| is_gift | true |
| shipping_address | Contains Justin's address |

**📝 Record**: `order_id` = ______________________
**📝 Record**: `order_number` = ______________________

---

### Step 4.3: Verify Line Items
**Action**: Query order_items table

```sql
SELECT 
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.title,
  oi.price,
  oi.quantity,
  oi.items
FROM order_items oi
WHERE oi.order_id = 'ORDER_ID_HERE';
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| title | Contains 'Zevo' |
| price | ~$45.00 |
| quantity | 1 |

---

### Step 4.4: Verify Execution Linked to Order
**Action**: Query automated_gift_executions

```sql
SELECT 
  age.id,
  age.status,
  age.order_id,
  age.payment_status
FROM automated_gift_executions age
WHERE age.id = 'EXECUTION_ID_HERE';
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| order_id | Matches order from Step 4.2 |
| status | 'order_created' or 'processing' |

---

## Phase 5: Simulate T-3 Fulfillment (Scheduler)

### Step 5.1: Run Scheduler at T-3 (Zinc Submission Stage)
**Action**: 
1. Set simulated date to `2026-12-22` (3 days before Christmas)
2. Click "Run Scheduler"

**Expected Behavior**:
- Scheduler captures payment (if not already)
- Submits order to Zinc API
- Updates order status to 'processing'

---

### Step 5.2: Verify Payment Captured
**Action**: Check Stripe Dashboard or query

```sql
SELECT 
  o.id,
  o.order_number,
  o.payment_status,
  o.stripe_payment_intent_id
FROM orders o
WHERE o.id = 'ORDER_ID_HERE';
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| payment_status | 'paid' or 'succeeded' |
| stripe_payment_intent_id | pi_xxx... |

---

### Step 5.3: Verify Zinc Submission
**Action**: Query orders for Zinc data

```sql
SELECT 
  o.id,
  o.status,
  o.zinc_request_id,
  o.zinc_order_id,
  o.fulfillment_status
FROM orders o
WHERE o.id = 'ORDER_ID_HERE';
```

**Expected State**:
| Field | Expected Value |
|-------|----------------|
| status | 'processing' |
| zinc_request_id | NOT NULL |
| fulfillment_status | 'submitted' or 'processing' |

**📝 Record**: `zinc_request_id` = ______________________

---

## Phase 6: Post-Test Verification

### Step 6.1: Check Edge Function Logs
**Action**: Review logs for each function:
- `auto-gift-orchestrator`
- `scheduled-order-processor`
- `create-checkout-session`
- `stripe-webhook-v2`
- `process-order-v2`

**Verification**:
- [ ] No unhandled errors
- [ ] Correct product selected (Zevo)
- [ ] Correct recipient address used
- [ ] Payment processed successfully

---

### Step 6.2: Verify Email Sent
**Action**: Query email_queue

```sql
SELECT 
  eq.id,
  eq.recipient_email,
  eq.template_id,
  eq.status,
  eq.sent_at
FROM email_queue eq
WHERE eq.recipient_email ILIKE '%charles%' OR eq.recipient_email ILIKE '%justin%'
ORDER BY eq.created_at DESC
LIMIT 5;
```

**Expected**: Approval notification and order confirmation emails

---

## Rollback Procedures

### Rollback Level 1: Delete Test Order Only
```sql
-- Delete order items first (foreign key)
DELETE FROM order_items WHERE order_id = 'ORDER_ID_HERE';

-- Delete the order
DELETE FROM orders WHERE id = 'ORDER_ID_HERE';

-- Reset execution
UPDATE automated_gift_executions 
SET order_id = NULL, status = 'approved', payment_status = NULL
WHERE id = 'EXECUTION_ID_HERE';
```

### Rollback Level 2: Delete Execution and Tokens
```sql
-- Delete notifications
DELETE FROM auto_gift_notifications 
WHERE execution_id = 'EXECUTION_ID_HERE';

-- Delete approval tokens
DELETE FROM email_approval_tokens 
WHERE execution_id = 'EXECUTION_ID_HERE';

-- Delete execution
DELETE FROM automated_gift_executions 
WHERE id = 'EXECUTION_ID_HERE';
```

### Rollback Level 3: Delete Rule (Full Reset)
```sql
-- First run Level 1 and Level 2, then:
DELETE FROM auto_gifting_rules WHERE id = 'RULE_ID_HERE';
```

### Stripe Refund (if payment was captured)
```bash
# Via Stripe Dashboard or API
stripe refunds create --payment-intent pi_xxx --reason requested_by_customer
```

---

## Error Handling Checkpoints

| Phase | Possible Error | Check | Resolution |
|-------|---------------|-------|------------|
| 1 | No payment method | Query payment_methods | Add payment method in Step 1.4 |
| 2 | Rule not found by orchestrator | Check date_type matches 'christmas' | Verify holidayDates.ts mapping |
| 2 | No notification created | Check edge function logs | Review notification_preferences in rule |
| 3 | Approval fails | Check token expiry | Generate new token if expired |
| 4 | No wishlist item found | Query wishlist_items | Verify Justin has items |
| 4 | Checkout session fails | Check Stripe logs | Verify payment_method_id is valid |
| 5 | Payment capture fails | Check Stripe dashboard | Card may have declined |
| 5 | Zinc submission fails | Check process-order-v2 logs | Address validation issue |

---

## Test Results Summary

| Phase | Step | Status | Notes |
|-------|------|--------|-------|
| 0 | Pre-test setup | ⬜ | |
| 1.1 | Navigate to /recurring-gifts | ⬜ | |
| 1.2 | Open setup modal | ⬜ | |
| 1.3 | Select recipient & event | ⬜ | |
| 1.4 | Set budget & payment | ⬜ | |
| 1.5 | Complete setup | ⬜ | |
| 1.6 | Verify rule in DB | ⬜ | |
| 2.1 | Open Trunkline | ⬜ | |
| 2.2 | Run orchestrator T-7 | ⬜ | |
| 2.3 | Verify notification | ⬜ | |
| 2.4 | Verify approval token | ⬜ | |
| 3.1 | Approve gift | ⬜ | |
| 3.2 | Verify execution status | ⬜ | |
| 4.1 | Run orchestrator T-4 | ⬜ | |
| 4.2 | Verify order created | ⬜ | |
| 4.3 | Verify line items | ⬜ | |
| 4.4 | Verify execution linked | ⬜ | |
| 5.1 | Run scheduler T-3 | ⬜ | |
| 5.2 | Verify payment captured | ⬜ | |
| 5.3 | Verify Zinc submission | ⬜ | |
| 6.1 | Check function logs | ⬜ | |
| 6.2 | Verify emails sent | ⬜ | |

**Overall Test Result**: ⬜ PENDING

---

## Recorded IDs (Fill During Test)

| Item | ID Value |
|------|----------|
| Charles user_id | |
| Justin user_id | |
| Connection ID | |
| Rule ID | |
| Execution ID | |
| Token ID | |
| Order ID | |
| Order Number | |
| Zinc Request ID | |
| Payment Intent ID | |
