
# Fix Auto-Gift Approval Page: Product Display & Event Context

## Problem Summary
The Auto-Gift Approval Page displays incomplete product information:
1. **No product image** - Component looks for `product.image` but data has `image_url`
2. **No product name** - Shows bullet point because component looks for `product.title` but data has `name`
3. **Shows raw UUID** - "Event: b37b3dc8-ac3a..." instead of "Justin Meeks's Birthday - February 19, 2026"
4. **Missing recipient context** - No indication of who the gift is for

## Root Cause: Field Name Mismatch

| Orchestrator Stores | Approval Page Expects |
|---------------------|----------------------|
| `product.name` | `product.title` |
| `product.image_url` | `product.image` |
| `product.product_id` | `product.product_id` ✓ |
| `product.price` | `product.price` ✓ |
| (not stored) | `product.category` |
| (not stored) | `product.retailer` |

Additionally, the page only displays `execution.rule_id` (a UUID) instead of using the rule's `date_type` and recipient info.

---

## Implementation Plan

### File to Modify
`src/components/auto-gifts/AutoGiftApprovalPage.tsx`

### Change 1: Fix Field Name Mapping in Product Display (Lines 287-314)

Update the product rendering to check for both old and new field names:

```tsx
{approvalData.products.map((product: any) => (
  <div key={product.product_id} className="flex items-center space-x-4 p-4 border rounded-lg">
    <Checkbox ... />
    {/* Support both image and image_url */}
    {(product.image || product.image_url) && (
      <img
        src={product.image || product.image_url}
        alt={product.title || product.name || 'Gift'}
        className="w-16 h-16 object-cover rounded"
      />
    )}
    <div className="flex-1">
      {/* Support both title and name */}
      <h3 className="font-medium">{product.title || product.name || 'Gift Item'}</h3>
      {/* Only show category/retailer if available */}
      {(product.category || product.retailer) && (
        <p className="text-sm text-muted-foreground">
          {[product.category, product.retailer].filter(Boolean).join(' • ')}
        </p>
      )}
      ...
    </div>
  </div>
))}
```

### Change 2: Add Recipient Event Context Card (Before Product List)

Replace the generic "Event: UUID" with human-readable context. The `approvalData.rule` contains `date_type` and `approvalData.rule.recipient` has the name:

```tsx
<CardHeader>
  <CardTitle>Gift Selection Details</CardTitle>
  <CardDescription className="space-y-1">
    <div className="flex items-center gap-2">
      <User className="h-4 w-4" />
      <span className="font-medium">{recipientName}'s {formatOccasion(rule.date_type)}</span>
    </div>
    <div className="flex items-center gap-2">
      <CalendarIcon className="h-4 w-4" />
      <span>{formatDate(execution.execution_date)}</span>
    </div>
    <div className="flex items-center gap-2">
      <span>Budget: Up to ${rule.budget_limit || 50}</span>
    </div>
  </CardDescription>
</CardHeader>
```

### Change 3: Add Helper Functions

Add simple formatters at the top of the component:

```tsx
const formatOccasion = (occasion: string): string => {
  if (!occasion) return 'Special Occasion';
  return occasion.replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};
```

### Change 4: Add Missing Imports

```tsx
import { User, CalendarDays } from "lucide-react";
```

---

## Visual Comparison

### Before (Current)
```
Gift Selection Details
Event: b37b3dc8-ac3a-4549-a978-399ec6ae8ad5 • Total Budget: $50

[✓] •                                    $42.74
```

### After (Fixed)
```
Gift Selection Details
👤 Justin Meeks's Birthday
📅 Wednesday, February 19, 2026
Budget: Up to $50

[✓] [PRODUCT IMAGE] TORRAS iPhone Case...  $42.74
    ⭐ 4.5 (1,234 reviews)
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Line 11 | Add `User, Calendar` imports |
| Lines 22-35 | Add `formatOccasion` and `formatDate` helpers |
| Lines 272-277 | Replace UUID with recipient/event info |
| Lines 287-314 | Fix field mapping (`image`→`image_url`, `title`→`name`) |

## Expected Result
After this fix:
- Product images will display correctly
- Product names will show instead of bullet points
- Header shows "Justin Meeks's Birthday - February 19, 2026" instead of UUID
- Budget context is preserved
