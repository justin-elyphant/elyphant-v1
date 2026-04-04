

## Seed Baby & Wedding Subcollections

### What We're Doing

The Baby and Wedding landing pages each have 5 subcollections (plus "All Items") that trigger specific search queries. Currently, these subcollection search terms have no cached products, so clicking them hits the Zinc API live or returns empty results. We need to pre-seed each subcollection.

### Subcollections to Seed

**Wedding (5 subcollections):**

| Subcollection | Search Term | Target Products |
|---|---|---|
| Bride & Groom | "wedding gifts for couple" | 20 |
| Bridal Party | "bridal party gifts" | 20 |
| Registry Favorites | "wedding registry gifts" | 20 |
| Wedding Decor | "wedding decorations" | 20 |
| Honeymoon | "honeymoon essentials" | 20 |

**Baby (5 subcollections):**

| Subcollection | Search Term | Target Products |
|---|---|---|
| Baby Essentials | "baby essentials" | 20 |
| Diapers & Wipes | "diapers and wipes" | 20 |
| Top Baby Brands | "top baby products" | 20 |
| Nursery Decor | "nursery decor" | 20 |
| Baby Clothing | "baby clothing" | 20 |

### Cost Estimate

- 10 subcollections x 20 products = 200 Zinc API calls
- At $0.01/call = **$2.00 total**

### Implementation

**Step 1: Call `seed-product-catalog` with subcollection search terms**
- Invoke the existing seeding function with each subcollection's exact `searchTerm` value
- Tag each product's `search_terms` column with the subcollection search term so cache lookups match
- Run in 2 batches (Wedding batch, Baby batch) to avoid timeouts

**Step 2: Verify cache hits**
- After seeding, confirm that clicking each subcollection card returns cached products instead of triggering live Zinc calls

### Files Modified
- None -- uses the existing `seed-product-catalog` edge function with new search terms passed at invocation time

