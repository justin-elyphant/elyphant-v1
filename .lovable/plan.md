

# Create Zinc V1 → V2 Migration Reference Document

## What
A permanent `.md` file in the repo documenting every V1 endpoint we use, its V2 equivalent, migration steps, and a phased rollout plan.

## Document Structure

The document will cover:

### 1. Endpoint Inventory (6 V1 endpoints across 9 edge functions)

```text
V1 Endpoint                              Edge Functions Using It           V2 Equivalent
─────────────────────────────────────────────────────────────────────────────────────────
GET  /v1/search                          get-products, seed-product-       GET /v2/search (adds pagination,
                                         catalog, nicole-weekly-curator    Bearer auth, retailer required)

GET  /v1/products/{id}                   get-product-detail                GET /v2/products/{id}

GET  /v1/products/{id}/offers            get-product-detail,               GET /v2/products/{id}/offers
                                         get-shipping-quote

POST /v1/orders                          process-order-v2                  POST /v2/orders (URL-based,
                                                                           postal_code, name field changes)

GET  /v1/orders/{id}                     order-monitor-v2                  GET /v2/orders/{id}

POST /v1/orders/{id}/cancel              cancel-zinc-order                 POST /v2/orders/{id}/cancel

GET  /v1/addax/balance                   manage-zma-accounts               Auto wallet top-up replaces
GET  /v1/addax/transactions              manage-zma-accounts               manual balance checks
```

### 2. Breaking Changes Checklist
- Auth: `Basic btoa(key + ':')` → `Bearer zn_...` (all 9 functions)
- Base URL: `api.zinc.io/v1` → `api.zinc.io/v2`
- Order schema: `product_id` → `url`, `zip_code` → `postal_code`, `first_name`/`last_name` → `name`
- Search: `retailer` param now required (already included in our calls)
- Wallet: manual balance polling → auto top-up configuration

### 3. Phased Migration Plan
- **Phase 0**: Create shared `supabase/functions/shared/zincClient.ts` abstraction
- **Phase 1**: Search endpoints (lowest risk — get-products, seed-product-catalog, nicole-weekly-curator)
- **Phase 2**: Product detail + offers (get-product-detail, get-shipping-quote)
- **Phase 3**: Order submission (process-order-v2 — highest risk, test thoroughly)
- **Phase 4**: Order monitoring + cancellation (order-monitor-v2, cancel-zinc-order)
- **Phase 5**: Wallet management (manage-zma-accounts — auto top-up)

### 4. Abstraction Layer Design
Single `zincClient.ts` with methods like `zincClient.search()`, `zincClient.getProduct()`, `zincClient.createOrder()` etc., with a `ZINC_API_VERSION` env var toggle.

## File Created
- `src/docs/ZINC_V2_MIGRATION.md` — the complete reference document

## Technical Details
- No code changes, no edge function modifications — document only
- Covers all 9 edge functions and 6 V1 endpoints
- Includes V2 request/response schema diffs for each endpoint
- References official V2 docs URLs

