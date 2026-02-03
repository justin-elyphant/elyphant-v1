
# Plan: Add Recipient Profile Interests Fallback to Auto-Gift Orchestrator

## Problem Summary
When the recipient's wishlist is empty (or all items purchased) AND the auto-gift rule has no `gift_selection_criteria`, the orchestrator falls back to a generic `'gift'` search. This ignores valuable personalization data that exists in the recipient's profile.

**Current State:**
- Justin's profile has interests: `["Dallas Cowboys", "Lululemon", "Adidas ultra boost", "MadeIn"]`
- Charles's auto-gift rule for Justin has empty `gift_selection_criteria`
- Justin's wishlist iPhone case was already purchased
- Result: The system would search for generic "gift" instead of "Dallas Cowboys gear"

## Solution: 4-Tier Gift Selection Hierarchy

```text
CURRENT LOGIC:
┌─────────────────────────────────────────┐
│ Tier 1: Unpurchased Wishlist Items      │ ← Check first
├─────────────────────────────────────────┤
│ Tier 2: Rule's gift_selection_criteria  │ ← Fallback if no wishlist
├─────────────────────────────────────────┤
│ Tier 3: Generic "gift" search           │ ← Last resort (too broad!)
└─────────────────────────────────────────┘

PROPOSED LOGIC:
┌─────────────────────────────────────────┐
│ Tier 1: Unpurchased Wishlist Items      │ ← Check first
├─────────────────────────────────────────┤
│ Tier 2: Rule's gift_selection_criteria  │ ← Fallback if no wishlist
├─────────────────────────────────────────┤
│ Tier 3: Recipient's Profile Interests   │ ← NEW! Use personalization
├─────────────────────────────────────────┤
│ Tier 4: Generic "gift" search           │ ← Last resort
└─────────────────────────────────────────┘
```

## Technical Implementation

### File: `supabase/functions/auto-gift-orchestrator/index.ts`

**Change 1: Expand unscheduled rules query to include interests (line 67)**

Currently fetches limited profile fields. Add `interests` to ensure it's available:

```typescript
// Before
.select('*, recipient:profiles!auto_gifting_rules_recipient_id_fkey(id, name, email, dob)')

// After
.select('*, recipient:profiles!auto_gifting_rules_recipient_id_fkey(id, name, email, dob, interests)')
```

**Change 2: Update search query logic in T-7 notification stage (around line 171)**

After checking wishlist, if `suggestedProducts` is empty, use recipient interests for the search:

```typescript
// If no wishlist items, try recipient profile interests
if (suggestedProducts.length === 0 && rule.recipient_id) {
  const recipientInterests = rule.recipient?.interests as string[] | null;
  if (recipientInterests?.length > 0) {
    console.log(`🎯 Using recipient interests for search: ${recipientInterests.slice(0, 3).join(', ')}`);
    
    // Search using first interest
    const { data: searchResult } = await supabase.functions.invoke('get-products', {
      body: {
        query: recipientInterests[0],
        limit: 5,
        filters: { maxPrice: rule.budget_limit || 100 }
      }
    });
    
    const products = searchResult?.results || searchResult?.products || [];
    suggestedProducts = products.slice(0, 3).map((p: any) => ({
      product_id: p.product_id || p.asin,
      name: p.title,
      price: p.price,
      image_url: p.image || p.main_image,
    }));
  }
}
```

**Change 3: Update fallback logic in T-4 purchase stage (lines 357-392)**

Modify the search query construction to include recipient interests as a tier:

```typescript
// Before (lines 360-363):
const criteria = rule.gift_selection_criteria as any;
const searchQuery = criteria.preferred_brands?.[0] 
  || criteria.categories?.[0] 
  || 'gift';

// After:
const criteria = rule.gift_selection_criteria as any;
const recipientInterests = rule.recipient?.interests as string[] | null;

const searchQuery = criteria?.preferred_brands?.[0] 
  || criteria?.categories?.[0] 
  || recipientInterests?.[0]  // NEW: Use recipient's interests
  || 'gift';

console.log(`🔍 Search query source: ${
  criteria?.preferred_brands?.[0] ? 'rule.preferred_brands' :
  criteria?.categories?.[0] ? 'rule.categories' :
  recipientInterests?.[0] ? 'recipient.interests' :
  'generic fallback'
}`);
```

## Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/auto-gift-orchestrator/index.ts` | 3 changes: query expansion, T-7 interests fallback, T-4 interests fallback |

## Expected Behavior After Fix

When Charles's rule triggers for Justin's Christmas gift:

1. **Tier 1**: Check Justin's wishlist - iPhone case already purchased, skip
2. **Tier 2**: Check rule's `gift_selection_criteria` - empty, skip
3. **Tier 3 (NEW)**: Check Justin's profile interests - finds "Dallas Cowboys"
4. **Search**: Call `get-products` with query "Dallas Cowboys" under $50
5. **Result**: Suggest Dallas Cowboys merchandise instead of generic gifts

## Test Plan

1. Deploy the updated orchestrator
2. Re-run with simulated date `2026-12-18`
3. Verify logs show: `🎯 Using recipient interests for search: Dallas Cowboys, Lululemon, Adidas ultra boost`
4. Verify Charles receives approval email with Dallas Cowboys-related gift suggestions

## Logging Improvements

The implementation adds clear logging to trace which tier was used:
- `🎯 Using recipient interests for search: ...` - when profile interests are used
- `🔍 Search query source: recipient.interests` - when interests drive the T-4 purchase
