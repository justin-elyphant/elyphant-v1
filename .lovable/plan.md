
# Fix Auto-Gift Approval Flow: Proper Payment Confirmation

## Problem Summary
When clicking "Approve & Order" redirects to Stripe Checkout, the execution is marked as `approved` immediately **before** the user actually pays. If the user abandons the checkout, the execution stays "approved" with no order, and subsequent attempts show "Already Approved" even though no gift was purchased.

**Current State for Charles's execution:**
- Status: `approved` 
- Order ID: `null` (no order created)
- Token: `approved_at` is set

---

## Root Cause Analysis

### Current Broken Flow
1. User clicks "Approve & Order"
2. `approve-auto-gift` creates Stripe Checkout session
3. Execution immediately marked `approved` (lines 527-535)
4. User redirected to Stripe → abandons checkout
5. No order created, but execution shows "approved"
6. User tries again → "Already Approved" error

### Correct Flow Should Be
1. User clicks "Approve & Order"
2. `approve-auto-gift` creates Stripe Checkout session
3. Execution marked `awaiting_payment` (new interim status)
4. User completes payment on Stripe
5. Webhook fires `checkout.session.completed`
6. Webhook updates execution to `approved` and links order_id

---

## Implementation Plan

### File 1: `supabase/functions/approve-auto-gift/index.ts`

**Change 1: Update status to `awaiting_payment` instead of `approved` (Lines 527-535)**

Change the status update after creating checkout session:
```typescript
// Update execution status to awaiting_payment (NOT approved yet)
await supabase
  .from('automated_gift_executions')
  .update({
    status: 'awaiting_payment',  // Changed from 'approved'
    total_amount: grandTotal,
    selected_products: productsToOrder,
    stripe_checkout_session_id: checkoutData?.sessionId, // Store for webhook lookup
    updated_at: new Date().toISOString(),
  })
  .eq('id', execution.id);
```

**Change 2: Update token to `pending_payment` instead of `approved_at` (Lines 537-547)**

Don't set `approved_at` yet since payment isn't confirmed:
```typescript
// Update token to track checkout initiation (not approval yet)
if (tokenRecord) {
  await supabase
    .from('email_approval_tokens')
    .update({
      checkout_initiated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tokenRecord.id);
}
```

**Change 3: Update status check at the beginning (around line 175)**

Allow re-processing of `awaiting_payment` executions:
```typescript
// Check for valid statuses (allow awaiting_payment to retry)
if (execution.status === 'approved' || execution.status === 'completed') {
  // Check if there's actually an order
  if (execution.order_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'This auto-gift has already been approved and ordered.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
  // No order exists - allow retry
  console.log('ℹ️ Execution marked approved but no order - allowing retry');
}
```

---

### File 2: `supabase/functions/stripe-webhook-v2/index.ts`

**Change: Add execution update after order creation**

After successfully creating an order with `is_auto_gift: true`, update the corresponding execution record. Add this logic after order creation (around line 724):

```typescript
// Update automated_gift_execution if this is an auto-gift order
if (isAutoGift && metadata.auto_gift_execution_id) {
  console.log(`📦 Updating auto-gift execution: ${metadata.auto_gift_execution_id}`);
  
  const { error: execUpdateError } = await supabase
    .from('automated_gift_executions')
    .update({
      status: 'approved',
      order_id: parentOrder.id,
      payment_status: 'paid',
      payment_confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', metadata.auto_gift_execution_id);

  if (execUpdateError) {
    console.error('⚠️ Failed to update auto-gift execution:', execUpdateError);
    // Don't throw - order is still created successfully
  } else {
    console.log('✅ Auto-gift execution updated with order reference');
  }

  // Also update the approval token
  const { error: tokenError } = await supabase
    .from('email_approval_tokens')
    .update({
      approved_at: new Date().toISOString(),
      approved_via: metadata.approved_via || 'checkout',
      updated_at: new Date().toISOString(),
    })
    .eq('execution_id', metadata.auto_gift_execution_id)
    .is('approved_at', null);

  if (!tokenError) {
    console.log('✅ Approval token updated');
  }
}
```

---

### File 3: `src/components/auto-gifts/AutoGiftApprovalPage.tsx`

**Change: Handle `awaiting_payment` status in the UI**

Update the status check to allow retry for `awaiting_payment`:
```typescript
// Allow retry if status is awaiting_payment (user abandoned checkout)
if (data.status === 'approved' && data.order_id) {
  setAlreadyApproved(true);
} else if (data.status === 'awaiting_payment') {
  // Allow user to retry checkout
  setApprovalData(data);
}
```

---

## Database Column Addition (Optional)

Add `stripe_checkout_session_id` column to `automated_gift_executions` to track the pending checkout:

```sql
ALTER TABLE automated_gift_executions 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
```

---

## Flow Diagram

```text
User clicks "Approve & Order"
        │
        ▼
┌─────────────────────────────────┐
│   approve-auto-gift             │
│   Creates Checkout Session      │
│   Status → 'awaiting_payment'   │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│   Stripe Checkout Page          │
│   User enters payment           │
└─────────────────────────────────┘
        │
    ┌───┴───┐
    │       │
    ▼       ▼
  Pays    Abandons
    │       │
    ▼       ▼
┌─────────┐ ┌─────────────────────┐
│ Webhook │ │ Status stays        │
│ Fires   │ │ 'awaiting_payment'  │
└─────────┘ │ User can retry      │
    │       └─────────────────────┘
    ▼
┌─────────────────────────────────┐
│   stripe-webhook-v2             │
│   Creates Order                 │
│   Updates execution:            │
│   - status → 'approved'         │
│   - order_id → new order        │
│   - payment_status → 'paid'     │
└─────────────────────────────────┘
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `approve-auto-gift/index.ts` | Use `awaiting_payment` status instead of `approved` for checkout flow |
| `approve-auto-gift/index.ts` | Allow retry if execution has no order_id |
| `stripe-webhook-v2/index.ts` | Update execution record when auto-gift checkout completes |
| `AutoGiftApprovalPage.tsx` | Handle `awaiting_payment` status in UI |

## Immediate Fix for Charles

Before deploying the full fix, reset Charles's execution to allow retry:
```sql
UPDATE automated_gift_executions 
SET status = 'pending_approval', updated_at = NOW() 
WHERE id = '74ccdab5-06f7-42e5-9ef2-fa347bbee23b';

UPDATE email_approval_tokens 
SET approved_at = NULL, approved_via = NULL, updated_at = NOW() 
WHERE execution_id = '74ccdab5-06f7-42e5-9ef2-fa347bbee23b';
```
