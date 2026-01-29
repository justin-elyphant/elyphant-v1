

# Recurring Gifts Simplification - Implementation Plan

## Summary

Simplify the over-engineered recurring gift (auto-gift) system to reuse the proven `scheduled-order-processor` pipeline you just tested successfully, while **fully preserving** the AI gift selection logic (Nicole AI choosing from wishlist/preferences/metadata).

## Current Problems

| Component | Lines/Records | Issue |
|-----------|---------------|-------|
| `auto-gift-orchestrator` | 510 lines | Duplicates payment + checkout logic already proven in `scheduled-order-processor` |
| `automated_gift_executions` | **0 records** | Never used tracking table |
| `email_approval_tokens` | **0 records** | Over-engineered email approval flow |
| `auto_gift_notifications` | **0 records** | Custom notifications never used |
| `auto_gifting_rules` columns | 27 columns | 15+ JSONB columns never read by any code |

## Solution Architecture

```text
+-------------------+     +-------------------------+     +---------------------------+
| auto_gifting_rules|     | create-checkout-session |     | scheduled-order-processor |
| (unchanged)       | --> | (proven flow)           | --> | (proven 3-stage)          |
|                   |     |                         |     |                           |
| Keeps all columns |     | Creates order with      |     | Stage 0: Authorize (>8d)  |
| including gift_   |     | scheduled_delivery_date |     | Stage 1: Capture (T-7)    |
| selection_criteria|     |                         |     | Stage 2: Submit (T-3)     |
+-------------------+     +-------------------------+     +---------------------------+
         |                         ^
         |                         |
         v                         |
+-------------------------+        |
| UnifiedGiftManagement   |--------+
| Service (PRESERVED)     |
|                         |
| 4-Tier Gift Selection:  |
| - Tier 1: Wishlist      |
| - Tier 2: Preferences   |
| - Tier 3: Metadata      |
| - Tier 4: AI Guess      |
+-------------------------+
```

## Preserved Components (NOT Touched)

1. **Gift Selection Logic** - `UnifiedGiftManagementService.selectGiftForRecipient()` (lines 311-409)
   - 4-tier hierarchical selection (wishlist → preferences → metadata → AI guess)
   - Relationship multipliers and age categories
   - Budget adjustments based on relationship type

2. **AutoGiftSetupFlow** - Frontend setup wizard stays exactly the same
   - Multi-event selection, budget controls, notification preferences
   - Payment method management
   - Product hints for AI suggestions

3. **`auto_gifting_rules` Table** - Keep all 27 columns
   - `gift_selection_criteria` JSONB used by selection logic
   - `relationship_context` JSONB used by selection logic
   - Other columns preserved for future use

## Implementation Plan

### Phase 1: Simplify `auto-gift-orchestrator` (Edge Function)

**Current:** 510 lines with duplicate checkout/payment logic
**Target:** ~200 lines that call existing services

**Changes:**
1. Remove duplicate payment method handling (checkout session handles it)
2. Remove duplicate Stripe interactions (rely on proven flow)
3. Add `simulatedDate` support for testing (like `scheduled-order-processor`)
4. Call `UnifiedGiftManagementService.selectGiftForRecipient()` equivalent via edge function call to `nicole-unified-agent` for gift selection
5. Create checkout session directly → order flows through `scheduled-order-processor`

**Simplified Flow:**
```
T-7: Orchestrator runs
  → Find rules with scheduled_date within 7 days
  → For each rule:
    1. Query recipient's wishlist for items within budget (simple first-pass)
    2. Send notification email to user with suggested gift
    3. If auto_approve enabled OR user approves:
       → Call create-checkout-session with scheduled_delivery_date = rule.scheduled_date
       → Order created with status "scheduled" or "pending_payment"
       → scheduled-order-processor handles the rest automatically
```

### Phase 2: Add Orchestrator Button to Trunkline

Add "Run Auto-Gift Orchestrator" button to `AutoGiftTestingTab` with simulated date support (matching existing "Run Scheduler" button).

**File:** `src/components/trunkline/AutoGiftTestingTab.tsx`

**Changes:**
- Add input field for simulated date
- Add button to invoke `auto-gift-orchestrator` with simulated date
- Display orchestrator results (notified, checkout created, failed)

**File:** `src/hooks/useAutoGiftTesting.ts`

**Changes:**
- Add `triggerOrchestrator(simulatedDate?: string)` function

### Phase 3: Database Cleanup (Future - After Testing)

**Tables to archive after validating new flow works:**
- `automated_gift_executions` (0 records)
- `email_approval_tokens` (0 records)
- `auto_gift_notifications` (0 records)

**Keep:**
- `auto_gifting_rules` - All columns preserved
- `auto_gift_event_logs` - 175 records of useful audit data

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/auto-gift-orchestrator/index.ts` | Simplify from 510 → ~200 lines |
| `src/components/trunkline/AutoGiftTestingTab.tsx` | Add orchestrator testing button |
| `src/hooks/useAutoGiftTesting.ts` | Add `triggerOrchestrator()` function |

## Files NOT Modified (Preserved)

| File | Reason |
|------|--------|
| `src/services/UnifiedGiftManagementService.ts` | Contains AI gift selection logic |
| `src/components/gifting/auto-gift/AutoGiftSetupFlow.tsx` | Frontend setup wizard |
| `supabase/functions/scheduled-order-processor/index.ts` | Proven pipeline |
| `supabase/functions/create-checkout-session/index.ts` | Proven checkout flow |
| `supabase/functions/approve-auto-gift/index.ts` | Approval handling |

## Expected Outcome

1. **Unified Pipeline** - Recurring gifts flow through the same proven `scheduled-order-processor` you just tested
2. **Simpler Testing** - Same simulated date testing pattern for both scheduled and recurring gifts
3. **Preserved AI Logic** - Gift selection criteria, wishlist priority, and preference-based selection unchanged
4. **Reduced Code** - 310+ lines removed from orchestrator
5. **Zero Data Loss** - All existing rules continue working

## Technical Details

### Simplified Orchestrator Logic

```typescript
// Pseudo-code for simplified flow
for (const rule of upcomingRules) {
  const daysUntil = getDaysUntil(new Date(rule.scheduled_date));
  
  if (daysUntil === NOTIFICATION_LEAD_DAYS) {
    // Get suggested products from wishlist
    const gifts = await getWishlistGifts(rule.recipient_id, rule.budget_limit);
    
    // Send notification email
    await sendNotificationEmail(rule, gifts);
    
    // If auto-approve is enabled, create checkout immediately
    if (rule.auto_approve) {
      await createCheckoutSession({
        cartItems: gifts.slice(0, 1),
        scheduledDeliveryDate: rule.scheduled_date,
        isAutoGift: true,
        autoGiftRuleId: rule.id
      });
    }
  }
}
```

### Order Status Flow After Checkout

```text
User approves gift (or auto-approve)
    ↓
create-checkout-session → order.status = "scheduled" (or "pending_payment" for >8 days)
    ↓
scheduled-order-processor (daily cron at 2 AM):
  - Stage 0 (T-7 for >8d orders): pending_payment → scheduled
  - Stage 1 (T-7): scheduled → payment_confirmed
  - Stage 2 (T-3): payment_confirmed → processing (Zinc submission)
    ↓
Zinc fulfills order → delivered
```

