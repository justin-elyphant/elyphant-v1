

# Add `vendor_new_order` Email Template

## Problem
The webhook invokes `ecommerce-email-orchestrator` with `eventType: 'vendor_new_order'`, but the `getEmailTemplate` switch has no matching case. It hits the `default` branch and throws `Unknown email event type: vendor_new_order`, causing the email to silently fail (caught by try/catch in the webhook).

## Data Available from Webhook
The webhook sends: `vendor_name`, `order_id`, `item_count`, `total_amount`.

## Changes

### 1. Add `vendorNewOrderTemplate` function (~line 938, before the template router)
- Uses `baseEmailTemplate` wrapper for consistent branding
- Content: greeting with vendor name, order summary card (order ID, item count, total amount), CTA button linking to `/vendor/orders`, note about fulfillment expectations
- Clean, professional tone matching existing templates

### 2. Add case to `getEmailTemplate` switch (~line 1019, before `default`)
```
case 'vendor_new_order':
  return {
    html: vendorNewOrderTemplate(data),
    subject: `New Order Received - ${data.item_count || ''} item(s) | $${...}`
  };
```

### 3. Enrich webhook payload (minor)
Add `vendor_payout` to the email data so the template can show "Your payout: $X.XX" — this value is already calculated in the webhook's `createVendorOrders` function.

**Single file change**: `supabase/functions/ecommerce-email-orchestrator/index.ts` (template + router case). Minor addition to `supabase/functions/stripe-webhook-v2/index.ts` (add `vendor_payout` to email data).

