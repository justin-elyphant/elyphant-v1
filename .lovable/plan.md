
# Fix: Auto Gift Testing Tab Crash - Invalid Date Columns

## Problem

The `AutoGiftTestingTab` component crashes with `RangeError: Invalid time value` when navigating to `/trunkline/auto-gift-testing`.

**Root Cause**: The component references two columns that don't exist in the `orders` table:
1. `zinc_scheduled_processing_date` - Line 322 attempts `format(new Date(order.zinc_scheduled_processing_date), ...)` but this column doesn't exist, returning `undefined`
2. `recipient_name` - Line 314 uses `order.recipient_name` but this column doesn't exist

When `new Date(undefined)` is passed to `date-fns format()`, it throws `RangeError: Invalid time value`.

---

## Database Reality

**Actual columns in `orders` table:**
- `scheduled_delivery_date` - EXISTS
- `zinc_scheduled_processing_date` - DOES NOT EXIST
- `recipient_name` - DOES NOT EXIST
- `shipping_address` - EXISTS (JSONB, contains recipient name)

---

## Solution

### File: `src/hooks/useAutoGiftTesting.ts`

Update the query to select `shipping_address` for extracting recipient info:

```typescript
// Current (line 104-112)
.select(`
  id,
  order_number,
  scheduled_delivery_date,
  status,
  created_at
`)

// Updated
.select(`
  id,
  order_number,
  scheduled_delivery_date,
  status,
  created_at,
  shipping_address
`)
```

### File: `src/components/trunkline/AutoGiftTestingTab.tsx`

1. **Fix recipient name display** (line 314):
```typescript
// Before
<p className="font-medium text-sm">{order.recipient_name}</p>

// After - extract from shipping_address JSONB
<p className="font-medium text-sm">
  {order.shipping_address?.name || order.order_number || 'Unknown'}
</p>
```

2. **Remove non-existent column reference** (lines 321-323):
```typescript
// Before
<p>
  Process: {format(new Date(order.zinc_scheduled_processing_date), 'MMM d, yyyy')}
</p>

// After - show order_number instead
<p className="font-mono">Order #{order.order_number}</p>
```

3. **Add null safety to scheduled_delivery_date** (line 319):
```typescript
// Before
Delivery: {format(new Date(order.scheduled_delivery_date), 'MMM d, yyyy')}

// After - with null check
Delivery: {order.scheduled_delivery_date 
  ? format(new Date(order.scheduled_delivery_date), 'MMM d, yyyy')
  : 'Not set'}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useAutoGiftTesting.ts` | Add `shipping_address` to query select |
| `src/components/trunkline/AutoGiftTestingTab.tsx` | Fix invalid column references and add null safety |

---

## Expected Result After Fix

The Scheduled Orders section will display:
```text
┌───────────────────────────────────────┐
│  Charles Meeks              scheduled │
│  Delivery: Feb 4, 2026               │
│  Order #63af4b                       │
└───────────────────────────────────────┘
```

Instead of crashing with "Something went wrong".
