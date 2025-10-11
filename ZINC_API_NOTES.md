# Developer Note: Zinc API Pricing & Tax Limitations

**Critical Discovery Date:** October 11, 2025

## Problem Summary
The Zinc API **does not provide a price preview/estimation endpoint**. This creates a fundamental challenge for e-commerce checkout flows where we need to charge customers the exact amount before knowing the final price.

## Key Findings from Zinc API Documentation

### 1. **No Preview Endpoint**
- **Issue:** You must place an actual order via `/v1/orders` to get the final total
- **Impact:** Cannot know final price (with tax) before charging customer
- **Result:** Risk of undercharging customers (as seen in Order #111-8464724-9310606: charged $12.86, actual $18.46)

### 2. **Shipping Quote Limitations** (`/v1/products/{id}/offers`)
- **What it provides:**
  - Pre-tax shipping estimates in `shipping_options[].price` (cents)
  - Prime eligibility via `marketplace_fulfilled: true` and `prime_only` fields
  - Multiple shipping options with estimated delivery times
  
- **What it DOES NOT provide:**
  - Final tax calculation (tax only available in post-order `price_components`)
  - Guaranteed final shipping cost
  - Combined total with all fees
  
- **Reliability:** Shipping estimates can differ from actual charges, especially for:
  - Non-Prime items
  - `shipping_method: 'cheapest'` selections
  - Multi-item orders with different sellers

### 3. **Tax Calculation**
- **No estimation endpoint exists**
- Tax is only available in the final order response's `price_components` object after order placement
- No way to calculate sales tax ahead of time for customer-facing pricing

### 4. **Shipping Method Behavior**
- `shipping_method` values (`'cheapest'`, `'free'`, `'fastest'`) work with `seller_selection_criteria`
- Setting `"prime": true` in `seller_selection_criteria` filters for Prime offers
- `shipping` object allows `max_days` and `max_price` constraints
- **Prime free shipping:** Often included but not guaranteed in quotes

### 5. **`max_price` Safety Mechanism**
- **Required for ZMA orders**
- Represents maximum total order price in cents (including shipping and tax)
- If exceeded, order fails with `max_price_exceeded` error
- **Critical usage:** This is our safety valve to prevent runaway charges

### 6. **Best Practice (per Zinc)**
- Zinc documentation does NOT specify a recommended workflow for payment authorization
- No official guidance on handling the price-before-order problem
- Implied approach: Either authorize higher amounts or add pricing buffers

## Real-World Example
**Order:** `111-8464724-9310606` (Oct 11, 2025)
- **Product:** KICKLEEN Biodegradable Sponges (B0BZS36SNX)
- **Product Price:** $9.99
- **Estimated/Quoted at Checkout:** $12.86
- **Actual Zinc Charges:**
  - Product: $9.99
  - Shipping: $6.99 (not Prime eligible, cheapest shipping)
  - Tax: $1.48
  - **Total: $18.46**
- **Discrepancy:** Undercharged by $5.60 (30% error)

## Recommended Solutions

### Immediate Fix: Safety Buffers
```typescript
// For non-Prime items:
const estimatedShipping = shippingQuote.price; // from /offers
const shippingBuffer = estimatedShipping * 1.2; // Add 20% buffer
const estimatedTax = (productPrice + shippingBuffer) * 0.10; // 10% tax estimate
const totalWithBuffer = productPrice + shippingBuffer + estimatedTax + elyphantFee;

// Always set max_price as safety valve:
const maxPrice = Math.ceil(totalWithBuffer * 1.05); // Allow 5% variance
```

### Long-term Options

**Option A: Authorize Higher, Capture Exact**
1. Authorize a buffered amount (e.g., 120% of estimate)
2. Place Zinc order
3. Capture only the exact Zinc total
4. Requires clear customer communication and consent

**Option B: Estimate High, Refund Difference**
1. Charge estimated total + buffer
2. Place Zinc order
3. Issue partial refund for any overage
4. Better for customer trust but operational overhead

**Option C: Accept Variance (Current Risk)**
- Absorb small losses on undercharges
- Flag large discrepancies for manual review
- Only viable if margins support it

## Integration Points to Update

1. **`supabase/functions/get-shipping-quote/index.ts`**
   - Add buffer calculation to returned shipping costs
   - Include tax estimation
   - Document limitations in response

2. **`src/utils/orderPricingUtils.ts`**
   - Update `calculateDynamicPricingBreakdown()` to include buffers
   - Add `applyZincPricingBuffer()` helper function

3. **Checkout Flow**
   - Display "Estimated Total" vs "Authorized Amount"
   - Add disclaimer about final price variance
   - Set `max_price` on all Zinc orders

4. **`process-zma-order` edge function**
   - Always set `max_price` based on authorized amount
   - Log estimated vs actual price discrepancies
   - Alert on discrepancies >10%

## Monitoring & Analytics

**Track:**
- Estimated vs actual shipping costs
- Estimated vs actual tax amounts
- Frequency of `max_price_exceeded` errors
- Average pricing variance by item type (Prime vs non-Prime)

**Use data to:**
- Refine buffer percentages
- Identify product categories with higher variance
- Improve tax estimation models by state/region

## Questions for Future Zinc API Updates

If Zinc releases new endpoints or documentation:
1. Any order preview/estimation endpoint?
2. Tax calculation API before order placement?
3. More reliable shipping quote guarantees?
4. Recommended best practices for payment flows?

## File References
- Shipping quote service: `supabase/functions/get-shipping-quote/index.ts`
- Order processing: `supabase/functions/process-zma-order/index.ts`
- Pricing utilities: `src/utils/orderPricingUtils.ts`
- Webhook handler: `supabase/functions/zinc-webhook-handler/index.ts`

## Last Updated
October 11, 2025 - Initial documentation based on Zinc support response
