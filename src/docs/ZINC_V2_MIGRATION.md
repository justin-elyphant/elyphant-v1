# Zinc V1 → V2 Migration Reference

> **Status:** Planning — no code changes yet  
> **Last updated:** 2026-04-09  
> **V2 Docs:** https://www.zinc.com/docs/v2/migrating-from-v1

---

## 1. Endpoint Inventory

| V1 Endpoint | Edge Functions Using It | V2 Equivalent | Risk |
|---|---|---|---|
| `GET /v1/search` | `get-products`, `seed-product-catalog`, `nicole-weekly-curator` | `GET /v2/search` — adds pagination, Bearer auth, `retailer` required | Low |
| `GET /v1/products/{id}` | `get-product-detail` | `GET /v2/products/{id}` | Low |
| `GET /v1/products/{id}/offers` | `get-product-detail`, `get-shipping-quote` | `GET /v2/products/{id}/offers` | Low |
| `POST /v1/orders` | `process-order-v2` | `POST /v2/orders` — URL-based, field renames | **High** |
| `GET /v1/orders/{id}` | `order-monitor-v2` | `GET /v2/orders/{id}` | Medium |
| `POST /v1/orders/{id}/cancel` | `cancel-zinc-order` | `POST /v2/orders/{id}/cancel` | Medium |
| `GET /v1/addax/balance` | `manage-zma-accounts` | Auto wallet top-up replaces manual polling | Medium |
| `GET /v1/addax/transactions` | `manage-zma-accounts` | Same — auto top-up reduces need | Medium |

**Total: 6 distinct endpoints across 9 edge functions.**

---

## 2. Breaking Changes Checklist

### Authentication (all 9 functions)
```diff
- Authorization: Basic ${btoa(ZINC_API_KEY + ':')}}
+ Authorization: Bearer zn_live_...
```
V2 uses prefixed API keys (`zn_live_...` / `zn_test_...`). Existing V1 keys will NOT work — must generate new keys in Zinc dashboard.

### Base URL
```diff
- https://api.zinc.io/v1
+ https://api.zinc.io/v2
```

### Search (`GET /v2/search`)
- `retailer` param is now **required** (we already pass it — no action needed)
- Response adds `pagination` object with `page`, `page_size`, `total_results`
- Product fields unchanged

### Product Detail (`GET /v2/products/{id}`)
- Largely unchanged — same response structure
- May include additional fields (MPP data, enhanced offers)

### Order Submission (`POST /v2/orders`) — ⚠️ BREAKING
```diff
  // Products array
- { "product_id": "B07XJ8C8F5", "quantity": 1 }
+ { "url": "https://www.amazon.com/dp/B07XJ8C8F5", "quantity": 1 }

  // Shipping address
- "first_name": "John",
- "last_name": "Doe",
+ "name": "John Doe",

- "zip_code": "10001",
+ "postal_code": "10001",
```

Key changes:
| V1 Field | V2 Field | Notes |
|---|---|---|
| `products[].product_id` | `products[].url` | Full Amazon URL required |
| `shipping_address.first_name` | `shipping_address.name` | Combined name field |
| `shipping_address.last_name` | _(removed)_ | Merged into `name` |
| `shipping_address.zip_code` | `shipping_address.postal_code` | Renamed |
| `billing_address.zip_code` | `billing_address.postal_code` | Renamed |
| `billing_address.first_name` | `billing_address.name` | Combined |

### Order Monitoring (`GET /v2/orders/{id}`)
- Response format may differ — need to verify `tracking` object structure
- Status enum values may change

### Wallet / ZMA (`GET /v1/addax/*`)
- V2 introduces **Auto Wallet Top-Up** (Feb 2026) — automatic funding when balance drops below threshold
- Manual balance polling becomes optional
- New endpoint: `POST /v2/wallet/auto-topup/configure`

---

## 3. Phased Migration Plan

### Phase 0: Abstraction Layer (do first)
**Goal:** Centralize all Zinc API calls into `supabase/functions/shared/zincClient.ts`

```typescript
// supabase/functions/shared/zincClient.ts
const ZINC_VERSION = Deno.env.get('ZINC_API_VERSION') || 'v1';
const BASE_URL = `https://api.zinc.io/${ZINC_VERSION}`;

export const zincClient = {
  search(query: string, retailer: string, options?: SearchOptions),
  getProduct(productId: string, retailer: string),
  getOffers(productId: string, retailer: string),
  createOrder(orderData: ZincOrderRequest),
  getOrder(requestId: string),
  cancelOrder(requestId: string),
  getWalletBalance(),
};
```

**Files to update:** All 9 edge functions — replace direct `fetch()` calls with `zincClient.*` methods.

### Phase 1: Search (lowest risk)
- Swap `zincClient.search()` internals to V2
- Affected: `get-products`, `seed-product-catalog`, `nicole-weekly-curator`
- Test: Run marketplace search, verify results match V1
- Rollback: Flip `ZINC_API_VERSION` env var back to `v1`

### Phase 2: Product Detail + Offers
- Swap `zincClient.getProduct()` and `zincClient.getOffers()` to V2
- Affected: `get-product-detail`, `get-shipping-quote`
- Test: View product detail page, check all fields populate

### Phase 3: Order Submission (highest risk) ⚠️
- Swap `zincClient.createOrder()` to V2
- Affected: `process-order-v2`
- **Must transform:** `product_id` → `url`, address field renames
- Test: Place test order with `is_test: true`, verify Zinc accepts it
- **Do NOT deploy to prod without 3+ successful test orders**

### Phase 4: Order Monitoring + Cancellation
- Swap `zincClient.getOrder()` and `zincClient.cancelOrder()` to V2
- Affected: `order-monitor-v2`, `cancel-zinc-order`
- Test: Monitor existing orders, verify status parsing

### Phase 5: Wallet Management
- Swap to auto top-up configuration
- Affected: `manage-zma-accounts`
- Test: Verify balance reporting, configure auto top-up threshold

---

## 4. Multi-Retailer Opportunity (V2 bonus)

V2 enables **Account-less Checkout** for non-Amazon retailers:
- Walmart
- Target
- Wayfair
- Best Buy

This means we can expand the marketplace without needing retailer credentials for each store. The `retailer` field in search and orders already exists in our schema.

**UI impact:** Add retailer selector to marketplace search (future feature).

---

## 5. Environment Variables Needed

| Variable | Current (V1) | New (V2) |
|---|---|---|
| `ZINC_API_KEY` | Basic auth key | `zn_live_...` prefixed key |
| `ZINC_API_VERSION` | _(not set)_ | `v1` or `v2` — toggle per phase |

---

## 6. Rollback Strategy

Each phase uses the `ZINC_API_VERSION` env var in `zincClient.ts`:
- Set to `v1` → all calls use V1 endpoints + auth
- Set to `v2` → all calls use V2 endpoints + auth
- Can be changed in Supabase dashboard without redeployment

---

## 7. Timeline Estimate

| Phase | Effort | Dependencies |
|---|---|---|
| Phase 0: Abstraction | 2-3 hours | None |
| Phase 1: Search | 1 hour | Phase 0, new API key |
| Phase 2: Product Detail | 1 hour | Phase 0 |
| Phase 3: Orders | 3-4 hours | Phase 0, thorough testing |
| Phase 4: Monitoring | 1 hour | Phase 0 |
| Phase 5: Wallet | 1-2 hours | Phase 0, auto top-up availability |
| **Total** | **~10-12 hours** | |

---

## References

- [V2 Migration Guide](https://www.zinc.com/docs/v2/migrating-from-v1)
- [V2 Search API](https://www.zinc.com/docs/v2/api-reference/products/search)
- [V2 MPP (Multi-retailer)](https://www.zinc.com/docs/v2/mpp)
- [V2 Order Schema](https://www.zinc.com/docs/v2/api-reference/orders)
