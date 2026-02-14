

## Clean Up: Remove Food-Related Categories and Cached Products

### What We're Removing

**1. Category Registry queries (`supabase/functions/shared/categoryRegistry.ts`)**

| Category | Query to Remove | Reason |
|---|---|---|
| gifts-for-her | `"coffee and tea gifts"` | Pulls consumable food/beverage items |
| gifts-under-50 | `"coffee accessories under 50"` | Pulls consumable coffee/tea products |

The `madein` brand (cookware) and `"kitchen gadgets under 50"` are safe -- they're kitchen tools, not food. `"best selling home kitchen essentials"` is also borderline safe since it targets kitchen tools.

**2. Cached products to delete from `products` table (2 items)**

| Product ID | Title | Why |
|---|---|---|
| B08W28BM7D | Bobo's Oat Bars Lemon Poppyseed | Grocery & Gourmet Food category (the Whole Foods item that caused the Zinc error) |
| B0CHXWX2JN | MTN OPS Ammo Meal Replacement Shake | Has "Whole Foods" in title, food/supplement |

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/shared/categoryRegistry.ts` | Remove 2 coffee/tea queries from gifts-for-her and gifts-under-50 |

### Database Change

```sql
DELETE FROM products 
WHERE product_id IN ('B08W28BM7D', 'B0CHXWX2JN');
```

### What We're Keeping (Safe)

- `madein` brand mappings (cookware/pans/knives -- kitchen tools, not food)
- `"kitchen gadgets under 50"` (gadgets, not consumables)
- `"best selling home kitchen essentials"` (tools, not food)
- `"candles and home fragrance"` (not food)

### Why This Is Enough

The enhanced `unsupportedProductFilter.ts` we just deployed will catch any future grocery/Whole Foods items at the search, product detail, and order submission layers. This cleanup just removes the queries that actively attract food items and purges the 2 cached food products.

