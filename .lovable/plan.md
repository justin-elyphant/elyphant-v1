
# Fix: Auto-Gift Approval - Invalid Email Error

## Problem Summary
When clicking "Approve & Order" on the Auto-Gift Approval page, the system fails with:
```
Invalid email address: auto-gift@system
```

**Root Cause:** The `approve-auto-gift` function passes `user_id` to `create-checkout-session` but doesn't pass `user_email`. The checkout function defaults to `'auto-gift@system'` which Stripe rejects as invalid.

---

## Technical Analysis

### Current Flow (Broken)
1. `approve-auto-gift` gets `userId` from the approval token (line 68)
2. Calls `create-checkout-session` with `metadata: { user_id: userId }` (line 447)
3. `create-checkout-session` looks for `clientMetadata?.user_email` (line 63)
4. Falls back to `'auto-gift@system'` (invalid email)
5. Stripe rejects when creating customer: "Invalid email address"

### Solution
Fetch the approving user's email in `approve-auto-gift` and pass it in the metadata to `create-checkout-session`.

---

## Implementation Details

### File to Modify
`supabase/functions/approve-auto-gift/index.ts`

### Change 1: Fetch User Email (After getting userId)

Add a query to get the approving user's email from the profiles table. This should be added around line 130, after we have the `userId`:

```typescript
// Get the approving user's email for Stripe
const { data: userProfile } = await supabase
  .from('profiles')
  .select('email')
  .eq('id', userId)
  .single();

const userEmail = userProfile?.email || '';
```

### Change 2: Pass User Email to Checkout Session (Line 447)

Update the metadata passed to `create-checkout-session`:

```typescript
metadata: {
  user_id: userId,
  user_email: userEmail,  // ADD THIS LINE
  is_auto_gift: 'true',
  auto_gift_rule_id: execution.rule_id,
  auto_gift_execution_id: execution.id,
  occasion: rule?.date_type,
  recipient_name: recipientName,
  approved_via: token ? 'email' : 'dashboard',
},
```

### Change 3: Add Validation (Optional Safety)

Add a fallback check before calling checkout:

```typescript
if (!userEmail) {
  console.error('❌ User email not found for checkout');
  return new Response(
    JSON.stringify({ success: false, error: 'User email required for payment' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
  );
}
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| ~Line 130 | Add query to fetch user email from `profiles` table |
| Line 447 | Add `user_email: userEmail` to metadata |
| ~Line 440 | Add validation that email exists before proceeding |

## Expected Result
After this fix:
- Approving user's actual email is fetched from their profile
- Email is passed to `create-checkout-session` in metadata
- Stripe creates customer with valid email
- Checkout session creates successfully
- User redirects to Stripe payment page
