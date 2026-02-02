

# Fix Auto-Gift Approval Flow: Token and Execution Creation

## Problem Summary
When Charles clicks "Approve Gift" in the email, the link goes to `undefined` because:
1. **No execution record exists** - The orchestrator doesn't create an `automated_gift_executions` record at T-7
2. **No approval token exists** - The orchestrator doesn't generate a token in `email_approval_tokens`
3. **No URLs passed to email** - The orchestrator doesn't send `approve_url` and `reject_url` to the email template

## Current Flow (Broken)
```
Orchestrator (T-7) → Email sent with rule_id only → No token → "undefined" links
```

## Fixed Flow
```
Orchestrator (T-7) → Create execution → Generate token → Pass URLs to email → Working links
```

---

## Implementation Plan

### Single File Change: `supabase/functions/auto-gift-orchestrator/index.ts`

All fixes are contained within the T-7 notification block (lines 113-188). No new files, no new functions.

#### Change 1: Create Execution Record (Before Email)
After gathering suggested products, create an `automated_gift_executions` record with status `pending_approval`:

```typescript
// Create execution record for approval tracking
const { data: execution, error: execError } = await supabase
  .from('automated_gift_executions')
  .insert({
    rule_id: rule.id,
    user_id: rule.user_id,
    execution_date: rule.scheduled_date,
    status: 'pending_approval',
    selected_products: suggestedProducts,
    total_amount: suggestedProducts.reduce((sum, p) => sum + (p.price || 0), 0),
  })
  .select('id')
  .single();
```

#### Change 2: Generate Approval Token
Using the same pattern as `generate-gift-preview-token`, create a secure token:

```typescript
// Generate secure approval token (same pattern as gift preview tokens)
const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

const { error: tokenError } = await supabase
  .from('email_approval_tokens')
  .insert({
    execution_id: execution.id,
    user_id: rule.user_id,
    token: token,
    expires_at: expiresAt.toISOString(),
  });
```

#### Change 3: Build and Pass URLs to Email Template
Construct the approval/reject URLs and add them to the email data:

```typescript
const baseUrl = 'https://elyphant.ai';
const approve_url = `${baseUrl}/auto-gifts/approve/${token}`;
const reject_url = `${baseUrl}/auto-gifts/approve/${token}?action=reject`;

// Add to email data
await supabase.functions.invoke('ecommerce-email-orchestrator', {
  body: {
    eventType: 'auto_gift_approval',
    recipientEmail: userData.email,
    data: {
      // ...existing fields...
      approve_url,   // NEW
      reject_url,    // NEW
      execution_id: execution.id,  // NEW (for logging)
    }
  }
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/auto-gift-orchestrator/index.ts` | Add 3 blocks in T-7 section (~30 lines) |

## Existing Infrastructure Reused

| Component | Status | Location |
|-----------|--------|----------|
| `email_approval_tokens` table | Exists | Database |
| `automated_gift_executions` table | Exists | Database |
| `AutoGiftApprovalPage` component | Exists | `src/components/auto-gifts/AutoGiftApprovalPage.tsx` |
| `approve-auto-gift` function | Exists | `supabase/functions/approve-auto-gift/index.ts` |
| Token lookup logic | Exists | Both use `.eq('token', token)` pattern |

## Expected Result

After fix, the email will contain working links:
- **Approve URL**: `https://elyphant.ai/auto-gifts/approve/abc123...`
- **Reject URL**: `https://elyphant.ai/auto-gifts/approve/abc123...?action=reject`

The existing `AutoGiftApprovalPage` will:
1. Look up the token in `email_approval_tokens`
2. Load the execution and products
3. Allow Charles to approve/reject

---

## Technical Details

### Insertion Point
The changes go inside the existing T-7 block, after line 145 (after suggested products are gathered) and before line 155 (before the email is sent).

### Current Code Structure (Lines 113-170)
```typescript
// T-7: Notification stage
if (daysUntil === PAYMENT_LEAD_TIME_CONFIG.NOTIFICATION_LEAD_DAYS) {
  // ... get wishlist items (existing)
  
  // === INSERT: Create execution record ===
  // === INSERT: Generate approval token ===
  
  // ... send email (existing, but add URLs to data)
  // ... log event (existing)
}
```

### Error Handling
If execution or token creation fails, the orchestrator will log the error and add the rule to `results.failed`, maintaining existing error handling patterns.

## Testing
After deployment:
1. Re-run orchestrator with date **02/12/2026**
2. Check Charles's email for working approve/reject links
3. Click "Approve Gift" to verify the `AutoGiftApprovalPage` loads correctly

