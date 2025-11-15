# Phase 2: Orders Table Column Analysis

## Summary
**Current State**: ~68 columns in `orders` table  
**Target State**: 22 core columns + 4 JSONB consolidation fields  
**Analysis Date**: 2025-11-15

---

## ✅ KEEP (22 Core Columns)

These columns are actively used by the 8 core V2 functions and must remain as individual columns:

### Identity & References (5)
1. **id** (uuid, PK) - Used by all functions
2. **user_id** (uuid) - Used by all functions for user lookups
3. **checkout_session_id** (text, UNIQUE) - **CRITICAL**: Idempotency key used by `stripe-webhook-v2` and `reconcile-checkout-session`
4. **payment_intent_id** (text) - Used by `scheduled-order-processor` for payment capture
5. **order_number** (text) - Used for display/tracking

### Status Tracking (2)
6. **status** (text) - Core state machine: `pending|payment_confirmed|scheduled|processing|fulfilled|failed|cancelled`
   - Used by: ALL V2 functions for status transitions
7. **payment_status** (text) - Payment state: `pending|authorized|paid|failed`
   - Used by: `process-order-v2`, `scheduled-order-processor`

### Pricing (3)
8. **total_amount** (numeric) - Order total
9. **currency** (text) - Currency code (default: USD)
10. **subtotal** (numeric) - **CANDIDATE FOR CONSOLIDATION** into line_items jsonb

### Auto-Gift Support (3)
11. **scheduled_delivery_date** (date, nullable) - Used by `scheduled-order-processor` for cron queries
12. **is_auto_gift** (boolean) - Flag for auto-gift orders
13. **auto_gift_rule_id** (uuid, nullable) - Link to auto_gifting_rules

### Zinc Integration (3)
14. **zinc_request_id** (text, nullable) - Zinc API request ID
15. **zinc_order_id** (text, nullable) - Zinc order tracking ID
16. **tracking_number** (text, nullable) - Shipping tracking number

### Timestamps (4)
17. **created_at** (timestamp) - Order creation time
18. **updated_at** (timestamp) - Last update time
19. **receipt_sent_at** (timestamp, nullable) - Receipt email timestamp
20. **cancelled_at** (timestamp, nullable) - Cancellation timestamp

### Admin Notes (1)
21. **cancellation_reason** (text, nullable) - Why order was cancelled

### Data Storage (1)
22. **notes** (text, nullable) - Admin/system notes, error messages

---

## 📦 CONSOLIDATE INTO JSONB (4 New Columns)

### 1. **line_items** (jsonb)
**Purpose**: Store all product/pricing details  
**Consolidates**:
- `delivery_groups` (jsonb) - Product groupings
- `cart_data` (jsonb) - Legacy cart data
- `subtotal` (numeric) - Move into jsonb
- `shipping_cost` (numeric) - Move into jsonb
- `tax_amount` (numeric) - Move into jsonb
- `gifting_fee` (numeric) - Move into jsonb
- `gifting_fee_name` (text)
- `gifting_fee_description` (text)

**Schema**:
```json
{
  "items": [
    {
      "product_id": "zinc_product_id",
      "title": "Product Name",
      "quantity": 1,
      "price": 49.99,
      "image": "url"
    }
  ],
  "subtotal": 49.99,
  "shipping_cost": 5.00,
  "tax_amount": 4.50,
  "gifting_fee": 2.00,
  "gifting_fee_name": "Gift Wrapping",
  "gifting_fee_description": "Premium gift wrap"
}
```

**Used by**:
- `stripe-webhook-v2`: Stores `delivery_groups` from metadata → `line_items.items`
- `process-order-v2`: Reads `line_items` to submit to Zinc
- `reconcile-checkout-session`: Stores Stripe line items → `line_items.items`

---

### 2. **shipping_address** (jsonb)
**Purpose**: Store all shipping/billing address fields  
**Consolidates**:
- `shipping_info` (jsonb) - Primary shipping address
- `billing_info` (jsonb) - Billing address
- `has_multiple_recipients` (boolean) - Multi-recipient flag
- `delivery_group_id` (uuid) - Delivery grouping

**Schema**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address_line1": "123 Main St",
  "address_line2": "Apt 4B",
  "city": "San Diego",
  "state": "CA",
  "postal_code": "92101",
  "country": "US",
  "has_multiple_recipients": false,
  "validation_warning": "missing_postal_code" // optional
}
```

**Used by**:
- `stripe-webhook-v2`: Extracts `ship_*` metadata fields → `shipping_address`
- `process-order-v2`: Reads `shipping_address` for Zinc submission
- `reconcile-checkout-session`: Extracts `ship_*` metadata → `shipping_address`

---

### 3. **gift_options** (jsonb)
**Purpose**: Store all gifting-related settings  
**Consolidates**:
- `is_gift` (boolean)
- `gift_message` (text)
- `is_surprise_gift` (boolean)
- `gift_scheduling_options` (jsonb)
- `gift_preview_viewed` (boolean)
- `gift_preview_viewed_at` (timestamp)

**Schema**:
```json
{
  "isGift": true,
  "giftMessage": "Happy Birthday!",
  "isSurprise": false,
  "schedulingOptions": {
    "deliveryDate": "2025-12-25",
    "notifyRecipient": false
  },
  "previewViewed": true,
  "previewViewedAt": "2025-11-15T12:00:00Z"
}
```

**Used by**:
- `stripe-webhook-v2`: Stores `is_gift`, `gift_message` from metadata → `gift_options`
- `process-order-v2`: Reads `gift_options` to customize Zinc order

---

### 4. **notes** (text) - ENHANCED
**Purpose**: Consolidate admin/system notes and error tracking  
**Consolidates**:
- `retry_reason` (text)
- `zma_error` (text)
- `webhook_token` (text)
- `funding_hold_reason` (text)
- Current `notes` field

**Format**: Pipe-delimited string for multi-source notes
```
Retry #2: Payment timeout | ZMA Error: stock_issue | Webhook: whsec_abc123
```

**Used by**:
- `admin-order-tools`: Writes retry/recovery notes
- `process-order-v2`: Writes Zinc error messages
- `stripe-webhook-v2`: May write webhook processing notes

---

## 🗑️ DELETE (46 Columns)

### Group A: Legacy Zinc Fields (5)
**Why**: Replaced by Zinc v2 API, no longer used
- `zma_order_id` - Old ZMA system identifier
- `zma_account_used` - Which ZMA account was used
- `zma_error` - ZMA-specific errors → move to `notes`
- `order_method` - Order method (zinc/zma)
- `zinc_status` - Duplicate of `status`

**Verification**: Grep codebase - no V2 functions reference these

---

### Group B: Email Tracking (5)
**Why**: Should be tracked in `email_queue` table, not orders
- `confirmation_email_sent` (boolean)
- `payment_confirmation_sent` (boolean)
- `status_update_emails_sent` (jsonb)
- `followup_email_sent` (boolean)
- `thank_you_sent` (boolean)
- `thank_you_sent_at` (timestamp)

**Migration**: Create `email_queue` entries for order emails instead

---

### Group C: Retry/Processing Metadata (6)
**Why**: Belongs in `auto_gift_fulfillment_queue` table for retry logic
- `retry_count` (integer)
- `retry_reason` (text) → move to `notes`
- `next_retry_at` (timestamp)
- `processing_attempts` (integer)
- `last_processing_attempt` (timestamp)
- `last_zinc_update` (timestamp)

**Migration**: Create `auto_gift_fulfillment_queue` entry when retries needed

---

### Group D: Group Gift Funding (9)
**Why**: Belongs in separate `group_gifts` table (if feature is active)
- `group_gift_project_id` (uuid)
- `funding_source` (text)
- `funding_status` (text)
- `funding_hold_reason` (text) → move to `notes`
- `funding_allocated_at` (timestamp)
- `expected_funding_date` (timestamp)
- `is_split_order` (boolean)
- `parent_order_id` (uuid)
- `split_order_index` (integer)
- `total_split_orders` (integer)

**Decision**: IF group gifts not in use, delete. If active, create dedicated table.

---

### Group E: Excessive Zinc Tracking (3)
**Why**: Over-detailed tracking not needed in orders table
- `zinc_timeline_events` (jsonb) - Full Zinc event history
- `merchant_tracking_data` (jsonb) - Merchant-specific data
- `zinc_scheduled_processing_date` (timestamp) - Use `scheduled_delivery_date`

**Migration**: Move critical events to `notes`, archive rest

---

### Group F: Duplicate/Redundant Fields (6)
**Why**: Already captured elsewhere or redundant
- `stripe_session_id` → renamed to `checkout_session_id`
- `stripe_payment_intent_id` → use `payment_intent_id`
- `webhook_token` → move to `notes` if needed
- `hold_for_scheduled_delivery` → inferred from `scheduled_delivery_date != null`
- `delivery_group_id` → move to `shipping_address.delivery_group_id`

---

### Group G: Consolidated into JSONB (12)
**Why**: Already covered in the 4 JSONB columns above
- `delivery_groups` → `line_items.items`
- `cart_data` → `line_items` (if needed)
- `shipping_cost` → `line_items.shipping_cost`
- `tax_amount` → `line_items.tax_amount`
- `gifting_fee` → `line_items.gifting_fee`
- `gifting_fee_name` → `line_items.gifting_fee_name`
- `gifting_fee_description` → `line_items.gifting_fee_description`
- `shipping_info` → `shipping_address`
- `billing_info` → `shipping_address.billing` (if needed)
- `has_multiple_recipients` → `shipping_address.has_multiple_recipients`
- `is_gift` → `gift_options.isGift`
- `gift_message` → `gift_options.giftMessage`
- `is_surprise_gift` → `gift_options.isSurprise`
- `gift_scheduling_options` → `gift_options.schedulingOptions`
- `gift_preview_viewed` → `gift_options.previewViewed`
- `gift_preview_viewed_at` → `gift_options.previewViewedAt`

---

## 📊 Function-by-Function Usage

### 1. stripe-webhook-v2
**Columns Used** (INSERT):
- `id`, `user_id`, `checkout_session_id`, `payment_intent_id`, `order_number`
- `status`, `payment_status`, `total_amount`, `currency`
- `scheduled_delivery_date`, `is_auto_gift`, `auto_gift_rule_id`
- `line_items`, `shipping_address`, `gift_options`
- `created_at`, `updated_at`

**Columns Used** (SELECT for idempotency):
- `id`, `status`, `receipt_sent_at`, `user_id`

---

### 2. reconcile-checkout-session
**Columns Used** (INSERT):
- Same as `stripe-webhook-v2` (mirrors webhook logic)

**Columns Used** (SELECT):
- `id`, `status`, `order_number`

---

### 3. process-order-v2
**Columns Used** (SELECT):
- `id`, `order_number`, `status`, `payment_status`, `zinc_order_id`
- `line_items`, `shipping_address`, `gift_options`
- `is_auto_gift`, `auto_gift_rule_id`

**Columns Used** (UPDATE):
- `status`, `zinc_request_id`, `zinc_order_id`, `notes`, `updated_at`

---

### 4. scheduled-order-processor
**Columns Used** (SELECT):
- `id`, `status`, `scheduled_delivery_date`, `payment_status`, `payment_intent_id`

**Columns Used** (UPDATE):
- `payment_status`, `status`, `notes`, `updated_at`

---

### 5. auto-gift-orchestrator
**Columns Used**: None directly (creates executions, not orders)
- Creates `automated_gift_executions` which later link to orders

---

### 6. order-monitor-v2
**Columns Used** (SELECT):
- `id`, `zinc_order_id`, `status`, `created_at`

**Columns Used** (UPDATE):
- `status`, `tracking_number`, `updated_at`

---

### 7. admin-order-tools
**Columns Used** (SELECT):
- `*` (full row for retry/recovery)

**Columns Used** (UPDATE):
- `status`, `zinc_request_id`, `notes`, `updated_at`

---

### 8. create-checkout-session
**Columns Used**: None (creates Stripe session, not order)
- Stores metadata that webhook/reconcile will use

---

## 🎯 Migration Strategy

### Step 1: Add JSONB Columns (Non-Breaking)
```sql
ALTER TABLE orders ADD COLUMN line_items_new jsonb DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN shipping_address_new jsonb DEFAULT '{}'::jsonb;
ALTER TABLE orders ADD COLUMN gift_options_new jsonb DEFAULT '{}'::jsonb;
ALTER TABLE orders ADD COLUMN notes_new text;
```

### Step 2: Migrate Data (Idempotent)
```sql
UPDATE orders SET 
  line_items_new = jsonb_build_object(
    'items', COALESCE(delivery_groups, '[]'::jsonb),
    'subtotal', subtotal,
    'shipping_cost', shipping_cost,
    'tax_amount', tax_amount,
    'gifting_fee', gifting_fee,
    'gifting_fee_name', gifting_fee_name,
    'gifting_fee_description', gifting_fee_description
  ),
  shipping_address_new = COALESCE(shipping_info, '{}'::jsonb) || 
    jsonb_build_object(
      'has_multiple_recipients', COALESCE(has_multiple_recipients, false)
    ),
  gift_options_new = jsonb_build_object(
    'isGift', COALESCE(is_gift, false),
    'giftMessage', gift_message,
    'isSurprise', COALESCE(is_surprise_gift, false),
    'schedulingOptions', gift_scheduling_options,
    'previewViewed', COALESCE(gift_preview_viewed, false),
    'previewViewedAt', gift_preview_viewed_at
  ),
  notes_new = CONCAT_WS(' | ',
    NULLIF(notes, ''),
    NULLIF(retry_reason, ''),
    NULLIF(zma_error, ''),
    NULLIF(webhook_token, ''),
    NULLIF(funding_hold_reason, '')
  )
WHERE line_items_new = '[]'::jsonb; -- Only migrate once
```

### Step 3: Rename checkout_session_id
```sql
ALTER TABLE orders RENAME COLUMN stripe_session_id TO checkout_session_id;
ALTER TABLE orders ADD CONSTRAINT orders_checkout_session_id_unique UNIQUE (checkout_session_id);
```

### Step 4: Drop Old Columns (Breaking)
```sql
ALTER TABLE orders 
  DROP COLUMN subtotal,
  DROP COLUMN shipping_cost,
  DROP COLUMN tax_amount,
  -- ... (all 46 deleted columns)
```

### Step 5: Rename New Columns (Finalize)
```sql
ALTER TABLE orders RENAME COLUMN line_items_new TO line_items;
ALTER TABLE orders RENAME COLUMN shipping_address_new TO shipping_address;
ALTER TABLE orders RENAME COLUMN gift_options_new TO gift_options;
ALTER TABLE orders RENAME COLUMN notes_new TO notes;
```

---

## ✅ Validation Queries

### Check Migration Completeness
```sql
-- Verify all orders have new JSONB data
SELECT COUNT(*) FROM orders WHERE line_items_new = '[]'::jsonb;
-- Should return 0

-- Verify shipping addresses migrated
SELECT COUNT(*) FROM orders WHERE shipping_address_new = '{}'::jsonb;
-- Should return 0 (or equal to orders with no shipping)

-- Verify no data loss
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN line_items_new IS NOT NULL THEN 1 END) as with_line_items,
  COUNT(CASE WHEN shipping_address_new IS NOT NULL THEN 1 END) as with_shipping
FROM orders;
```

### Check Column Usage (Before Deletion)
```sql
-- Find columns with non-null values that might be in use
SELECT column_name, COUNT(*) as non_null_count
FROM (
  SELECT 
    'zma_order_id' as column_name, COUNT(*) FROM orders WHERE zma_order_id IS NOT NULL
  UNION ALL
  SELECT 'zma_error', COUNT(*) FROM orders WHERE zma_error IS NOT NULL
  -- ... repeat for all deleted columns
) counts
WHERE non_null_count > 0;
```

---

## 🚨 Rollback Plan

If migration fails, keep old columns as `_legacy` suffix for 7 days:
```sql
-- Instead of DROP, rename for safety
ALTER TABLE orders RENAME COLUMN subtotal TO subtotal_legacy;
-- ... etc

-- After 7 days of production validation:
ALTER TABLE orders DROP COLUMN subtotal_legacy;
```

---

## 📋 Next Steps

1. ✅ **Step 1 Complete**: Column usage analysis documented
2. ⏭️ **Step 2**: Create migration script (see migration.sql)
3. ⏭️ **Step 3**: Update V2 functions to use new schema
4. ⏭️ **Step 4**: Test on staging database
5. ⏭️ **Step 5**: Deploy to production
