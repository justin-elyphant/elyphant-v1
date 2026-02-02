
# Fix Auto-Gift Approval Email Template Bugs

## Problem Summary
The auto-gift approval email sent to Charles contains two bugs:
1. **Wrong greeting name**: Says "Hi Justin" instead of "Hi Charles"
2. **Missing product title**: Shows "undefined" instead of the product name

## Root Cause Analysis

### Bug 1: Greeting Uses Wrong Name
- **Location**: `supabase/functions/ecommerce-email-orchestrator/index.ts` line 427
- **Issue**: Template uses `props.recipient_name` (the gift recipient - Justin) instead of `props.first_name` (the shopper - Charles)
- **Data available**: The orchestrator correctly passes both `first_name: "Charles"` and `recipient_name: "Justin Meeks"`

### Bug 2: Product Title Shows "undefined"
- **Location**: `supabase/functions/ecommerce-email-orchestrator/index.ts` lines 434, 437
- **Issue**: Template references `gift.title` but the orchestrator sends the field as `gift.name`
- **Data mapping mismatch**:
  - Orchestrator sends: `{ name: "TORRAS iPhone Case...", price: 42.74, image_url: "..." }`
  - Template expects: `{ title: "...", price: "...", image_url: "..." }`

## Implementation Plan

### Step 1: Fix Greeting (Line 427)
Change from:
```html
Hi ${props.recipient_name}, it's time to approve...
```
To:
```html
Hi ${props.first_name}, it's time to approve your upcoming auto-gift for ${props.recipient_name}'s ${props.occasion}!
```

This makes the greeting address Charles (the shopper) and clarifies whose gift is being approved.

### Step 2: Fix Product Title Display (Lines 434, 437)
Change from:
```html
alt="${gift.title}"
...
${gift.title}
```
To:
```html
alt="${gift.name}"
...
${gift.name}
```

### Step 3: Format Price Display (Line 438)
The price is passed as a number but displayed without currency formatting. Update to:
```html
${typeof gift.price === 'number' ? `$${gift.price.toFixed(2)}` : gift.price}
```

## Files to Modify
| File | Changes |
|------|---------|
| `supabase/functions/ecommerce-email-orchestrator/index.ts` | Fix 3 lines (427, 434, 437-438) |

## Expected Result
After fixing, the email will display:
- **Greeting**: "Hi Charles, it's time to approve your upcoming auto-gift for Justin Meeks's birthday!"
- **Product**: "TORRAS iPhone 16 Pro Max Case..." with $42.74 price

## Testing
After deployment, re-run the orchestrator with simulated date 02/12/2026 to verify the corrected email content.

---

## Technical Details

### Current Code (Lines 424-442)
```typescript
const autoGiftApprovalTemplate = (props: any): string => {
  const content = `
    <h2>Auto-Gift Approval Needed 🎁</h2>
    <p>Hi ${props.recipient_name}, it's time to approve...</p>  // BUG: wrong name
    ...
    <img alt="${gift.title}" .../>  // BUG: undefined
    <p>${gift.title}</p>  // BUG: undefined
    <p>${gift.price}</p>  // Minor: no currency format
```

### Fixed Code
```typescript
const autoGiftApprovalTemplate = (props: any): string => {
  const content = `
    <h2>Auto-Gift Approval Needed 🎁</h2>
    <p>Hi ${props.first_name}, it's time to approve your upcoming auto-gift for ${props.recipient_name}'s ${props.occasion}!</p>
    ...
    <img alt="${gift.name}" .../>
    <p>${gift.name}</p>
    <p>${typeof gift.price === 'number' ? `$${gift.price.toFixed(2)}` : gift.price}</p>
```
