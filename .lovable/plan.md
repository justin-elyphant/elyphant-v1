## Problem

Two related issues surfaced when testing search:

**1. Blank page after clicking a product from search (primary issue)**
Console shows `No routes matched location "/product/B00MAKOMJ8"`. The header search bar (`UnifiedSearchBar.tsx:251`) and 5 other components navigate to `/product/:id`, but `App.tsx` only registers `/marketplace/product/:id`. React Router renders nothing → blank page.

**2. Friend search RPC throwing column error (secondary, but spammy)**
`search_users_for_friends` RPC fails with `column p.data_sharing_settings does not exist`. The fallback direct query still runs so people search mostly works, but every keystroke logs an error and the privacy-aware path is silently broken (it only returns publicly-visible profiles, ignoring connection policies).

## Fix

### Step 1 — Add `/product/:id` route alias
In `src/App.tsx`, add a route alongside the existing marketplace route:

```tsx
<Route path="/marketplace/product/:id" element={<ProductDetailsPage />} />
<Route path="/product/:id" element={<ProductDetailsPage />} />
```

This is the lowest-risk fix — both paths render the same page, no consumer changes needed. (We can normalize to a single canonical path in a follow-up if desired.)

### Step 2 — Repair `search_users_for_friends` RPC
Migration to drop the stale `p.data_sharing_settings` reference. The function should join/read from `public.privacy_settings` instead (the canonical source per the Privacy Architecture memory). Specifically:
- Replace any `p.data_sharing_settings` references with the equivalent column on `public.privacy_settings` (via join on `user_id`), or remove the predicate if it's no longer needed for visibility.
- Keep `SECURITY DEFINER`, `SET search_path = public`, and the existing signature `(search_term text, requesting_user_id uuid, search_limit int)`.

I'll inspect the current function body via a migration `CREATE OR REPLACE` so we can see the exact SQL and rewrite it cleanly.

### Step 3 — Verify
- Reload preview, search "scotch brite", click a product → product detail page loads (not blank).
- Type in people search → no `42703` errors in console; results return.

## Out of scope

- Consolidating the 6 call sites onto a single canonical route (cosmetic, not blocking).
- Any Prime cataloging work — that resumes after this fix.