
# Plan: Fix Auto-Gift Orchestrator Product Selection Quality

## Issues Identified

Based on the screenshot and code analysis, there are 3 bugs affecting gift suggestions:

| Issue | Screenshot Evidence | Root Cause |
|-------|---------------------|------------|
| **$3,374 water bottle** | Shows $3374.00 instead of ~$33.74 | Price filtering happens BEFORE normalization in `get-products` |
| **Women's jersey for male** | CeeDee Lamb Women's Jersey suggested | No gender-aware filtering for recipients |
| **Products over $50 budget** | $97.49 jersey shown despite $50 limit | Same price normalization bug - cents treated as dollars |
| **All gifts from one interest** | All 3 products are Dallas Cowboys | Only `recipientInterests[0]` is used |

## Root Cause Analysis

### Bug #1 & #3: Price Filtering on Raw Cents

In `supabase/functions/get-products/index.ts`, the filtering flow is:

```text
Zinc API Response (prices in CENTS: 3374, 4999, 9749)
    ↓
Price Filter: maxPrice=50 → 3374 > 50? YES, passes filter ❌
    ↓  
normalizePrices() → 3374/100 = $33.74
    ↓
Returns $33.74 BUT should have been filtered
```

The filter at lines 1254-1264 treats raw Zinc prices as dollars, but Zinc returns cents.

### Bug #2: No Gender-Aware Search

The orchestrator searches "Dallas Cowboys" without considering recipient gender. Results include women's jerseys because they match the search term.

### Bug #4: Single Interest Only

Current code (line 180):
```typescript
query: recipientInterests[0], // Only uses first interest
```

## Solution

### Change 1: Fix Price Filtering (Pre-Normalize Before Filter)

**File:** `supabase/functions/get-products/index.ts`

Move price normalization BEFORE the price filter, or convert the filter threshold to cents for comparison:

```typescript
// Before filtering, normalize filter values to match Zinc's cent-based pricing
const maxPriceInCents = maxPrice ? maxPrice * 100 : null;
const minPriceInCents = minPrice ? minPrice * 100 : null;

filteredResults = filteredResults.filter(product => {
  const price = product.price;
  if (!price) return true;
  
  let passesFilter = true;
  if (minPriceInCents && price < minPriceInCents) passesFilter = false;
  if (maxPriceInCents && price > maxPriceInCents) passesFilter = false;
  
  return passesFilter;
});
```

### Change 2: Diversify Across Multiple Interests

**File:** `supabase/functions/auto-gift-orchestrator/index.ts`

Instead of searching ONE interest 3 times, search EACH interest once:

```typescript
// Tier 3 Fallback: Diversify across recipient interests
if (suggestedProducts.length === 0 && rule.recipient_id) {
  const recipientInterests = rule.recipient?.interests as string[] | null;
  if (recipientInterests?.length) {
    console.log(`🎯 Using recipient interests for search: ${recipientInterests.slice(0, 3).join(', ')}`);
    
    // Search up to 3 different interests for variety
    for (const interest of recipientInterests.slice(0, 3)) {
      const { data: searchResult, error: searchError } = await supabase.functions.invoke('get-products', {
        body: {
          query: interest,
          limit: 2, // Get 1-2 products per interest
          filters: { maxPrice: rule.budget_limit || 100 }
        }
      });
      
      if (!searchError) {
        const products = searchResult?.results || searchResult?.products || [];
        const mapped = products.slice(0, 1).map((p: any) => ({ // Take 1 per interest
          product_id: p.product_id || p.asin,
          name: p.title,
          price: p.price,
          image_url: p.image || p.main_image,
          interest_source: interest // Track which interest this came from
        }));
        suggestedProducts.push(...mapped);
      }
      
      // Stop if we have enough products
      if (suggestedProducts.length >= 3) break;
    }
    
    console.log(`✅ Found ${suggestedProducts.length} products across ${Math.min(recipientInterests.length, 3)} interests`);
  }
}
```

### Change 3: Add Gender Filter for Recipients (Optional Enhancement)

**File:** `supabase/functions/auto-gift-orchestrator/index.ts`

If the recipient has gender in their profile, exclude products that don't match:

```typescript
// Fetch recipient gender for filtering
const recipientGender = rule.recipient?.gender; // Requires adding 'gender' to the select query

// Post-filter: Remove gender-mismatched products
if (recipientGender && suggestedProducts.length > 0) {
  const genderTerms = recipientGender === 'male' 
    ? ['women', 'womens', "women's", 'ladies', 'female'] 
    : ['men', 'mens', "men's", 'male'];
  
  suggestedProducts = suggestedProducts.filter(p => {
    const title = (p.name || '').toLowerCase();
    return !genderTerms.some(term => title.includes(term));
  });
}
```

## Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/get-products/index.ts` | Fix price filtering to account for Zinc's cent-based pricing |
| `supabase/functions/auto-gift-orchestrator/index.ts` | 1) Diversify across multiple interests, 2) Add gender mismatch filtering, 3) Add recipient gender to profile query |

## Expected Behavior After Fix

When Charles's rule triggers for Justin (male, interests: Dallas Cowboys, Lululemon, Adidas Ultra Boost):

1. **Price Filtering**: Only products ≤ $50 are returned (filter correctly applied on normalized prices)
2. **Diversity**: Suggestions include:
   - 1 Dallas Cowboys product (e.g., hat, flag, mug)
   - 1 Lululemon product (e.g., headband, socks)
   - 1 Adidas Ultra Boost product (if under $50, or skip)
3. **Gender Filtering**: Women's jerseys excluded because Justin is male

## Test Plan

1. Deploy updated edge functions
2. Re-run orchestrator with simulated date `2026-12-18`
3. Verify:
   - [ ] All suggested products are ≤ $50
   - [ ] Products come from different interests (not all Cowboys)
   - [ ] No women's products suggested for male recipient
   - [ ] Prices display correctly in email ($33.74, not $3374)
