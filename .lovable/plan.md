

## Problem: Relevance Filter Kills Conceptual Searches + No Typo Tolerance

### Root Cause (from edge function logs)

Zinc returned **51 products** for "motivational books" — titles like "The Subtle Art of Not Giving a F\*ck", "Atomic Habits", "Can't Hurt Me", etc. But the brand-aware relevance filter **rejected all 51** (`51 → 0 products`).

Why: The product-type enforcement (line 161-187 of `brandAwareFilter.ts`) extracts non-brand, non-generic terms from the query — here `["motivational", "books"]` — and requires at least one to appear in the product's `title`, `brand`, or `category` (with stemming). For most motivational books:
- "motivational" doesn't appear in titles like "Atomic Habits" or "The 7 Habits of Highly Effective People"
- "books" doesn't appear in the title either
- Zinc's category field is often "Self-Help" or "Personal Development", not "Books"

The -200 penalty drops every product below the 150 minScore threshold for multi-word queries. Result: zero products returned.

### Two Fixes

**1. Relax the relevance filter for conceptual/category searches**

**File: `supabase/functions/shared/brandAwareFilter.ts`**

- **Add `description` to relevance scoring**: Check product-type terms against `product.description` too, not just title/brand/category. Many book descriptions contain "motivational" even when titles don't.
- **Add a zero-results safety net in `applyBrandAwareFilter`**: If the filter eliminates ALL products (51 → 0), fall back to a relaxed threshold (minScore of 0 — just sort by whatever score they have). This prevents total wipeouts for conceptual searches while still ranking better matches higher.
- **Reduce product-type penalty**: Lower from -200 to -100. Combined with category/title match bonuses, this keeps genuinely irrelevant products out while allowing conceptually related ones through.

**2. Add fuzzy/typo tolerance via common normalization**

**File: `supabase/functions/shared/brandAwareFilter.ts`**

- Add a lightweight Levenshtein distance check (edit distance ≤ 2) in the `stemWord` or a new `fuzzyMatch` helper
- Use it in `calculateRelevanceScore` as a fallback when exact/stem matching fails — award partial points (e.g., +20) for close matches
- This handles "legoes" → "legos", "motivatonal" → "motivational", etc.

No client-side changes needed. No new edge functions. Both fixes are in a single shared file that's already imported by `get-products` and available to `search-suggestions` via the fallback.

### Why This Won't Break Existing Searches

The zero-results safety net only activates when the filter would otherwise return nothing. For searches that already work well (like "nike socks", "legos"), the existing scoring and thresholds remain unchanged. The Levenshtein check only fires as a fallback after exact and stem matching fail, with lower point values so it doesn't outrank exact matches.

