

# Buy Now + Recur Later: Unified Product-to-Recurring Flow

## Problem Statement

When a user clicks "Schedule as Gift" → "Recurring" from a product page (e.g., Apple AirPods for Mom's birthday):

**Current behavior**: Creates a recurring rule BUT doesn't add the product to cart → **Lost sale**

**Desired behavior**: 
1. ✅ Add THIS product to cart for THIS occasion (immediate purchase)
2. ✅ Create recurring rule for NEXT year with product context saved
3. ✅ Show upsell banners in cart when holiday detected

---

## Solution Overview

### Three Integrated Features

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRODUCT PAGE                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [Schedule as Gift]                                              │   │
│  │      └─► "Recurring" mode selected                               │   │
│  │           └─► DUAL ACTION:                                       │   │
│  │                ✓ Add product to cart for Dec 25, 2026           │   │
│  │                ✓ Create recurring rule for Dec 25, 2027+        │   │
│  │                ✓ Save product hints: category, brand, price     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                             CART                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📦 Charles Meeks (2 items)                                      │   │
│  │     Scheduled: Dec 25, 2026                                      │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  🔔 This is Christmas! Make it a recurring gift?                 │   │
│  │                                    [Make Recurring]  [Dismiss]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      ORDER CONFIRMATION                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ✨ Want to automate this gift for Charles next year?           │   │
│  │     You just gifted AirPods for Christmas.                       │   │
│  │     Set up recurring and we'll remind you next December!         │   │
│  │                        [Set Up Recurring Gift]                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Product Page "Buy + Recur" Flow

### Changes to UnifiedGiftSchedulingModal.tsx

**New Prop**:
```typescript
interface UnifiedGiftSchedulingModalProps {
  // ... existing props
  productContext?: {
    productId: string;
    title: string;
    brand?: string;
    category?: string;
    price: number;
    image: string;
  };
}
```

**New Behavior in Recurring Mode**:

When user completes AutoGiftSetupFlow from a product page:
1. First, execute one-time scheduling (add to cart + assign recipient)
2. Then, create the recurring rule with product context saved

```typescript
// Enhanced recurring complete handler
const handleRecurringComplete = (ruleResult: any) => {
  // Step 1: If product exists, add to cart for THIS occasion (immediate sale)
  if (product && selectedRecipient) {
    const selectedDate = getNextOccasionDate(ruleResult.dateType); // e.g., Dec 25, 2026
    
    addToCart({
      ...product,
      product_id: getEffectiveProductId?.() || product.product_id,
    });
    
    assignItemToRecipient(effectiveProductId, {
      connectionId: selectedRecipient.connectionId,
      connectionName: selectedRecipient.connectionName,
      deliveryGroupId: `gift_${Date.now()}`,
      scheduledDeliveryDate: selectedDate.toISOString(),
      giftMessage: giftMessage || undefined,
      shippingAddress: selectedRecipient.shippingAddress,
      address_verified: selectedRecipient.addressVerified
    });
    
    toast.success('Added to cart for this year!', {
      description: `Also set up recurring gift for future ${ruleResult.dateType}s`
    });
  }
  
  onComplete?.({
    mode: 'recurring',
    alsoAddedToCart: !!product,
    ...ruleResult
  });
  onOpenChange(false);
};
```

### Changes to AutoGiftSetupFlow.tsx

**New Props**:
```typescript
interface AutoGiftSetupFlowProps {
  // ... existing props
  productHints?: {
    productId: string;
    title: string;
    brand?: string;
    category?: string;
    priceRange: [number, number]; // e.g., [140, 200] for AirPods
    image: string;
  };
}
```

**Save Product Context in gift_selection_criteria**:

```typescript
// In rulesToCreate mapping (around line 427)
gift_selection_criteria: {
  source: productHints ? "specific" : "both",
  specific_product_id: productHints?.productId, // Nicole can suggest same or similar
  preferred_brands: productHints?.brand ? [productHints.brand] : [],
  categories: productHints?.category ? [productHints.category] : [],
  max_price: formData.budgetLimit,
  min_price: Math.max(1, formData.budgetLimit * 0.1),
  // Original product as reference for AI
  original_product_reference: productHints ? {
    title: productHints.title,
    image: productHints.image,
    price: productHints.priceRange[0]
  } : undefined,
  exclude_items: [],
}
```

---

## Phase 2: Cart Holiday Detection Banner

### New Component: RecurringGiftUpsellBanner.tsx

```typescript
interface RecurringGiftUpsellBannerProps {
  deliveryGroup: DeliveryGroup;
  cartItems: CartItem[];
  onConvert: () => void;
  onDismiss: () => void;
}
```

**Logic**:
1. Check if `deliveryGroup.scheduledDeliveryDate` matches a holiday
2. Check if user already has a recurring rule for this recipient + occasion
3. If no rule exists, show banner

### Changes to RecipientPackagePreview.tsx

**Add Holiday Detection**:
```typescript
import { detectHolidayFromDate } from '@/constants/holidayDates';
import RecurringGiftUpsellBanner from './RecurringGiftUpsellBanner';
import { useUnifiedGiftRules } from '@/hooks/useUnifiedGiftRules';

// Inside component
const { rules } = useUnifiedGiftRules();
const [bannerDismissed, setBannerDismissed] = useState(false);

// Detect if scheduled date is a holiday
const detectedHoliday = useMemo(() => {
  if (!deliveryGroup.scheduledDeliveryDate) return null;
  return detectHolidayFromDate(new Date(deliveryGroup.scheduledDeliveryDate));
}, [deliveryGroup.scheduledDeliveryDate]);

// Check if rule already exists for this recipient + occasion
const hasExistingRule = useMemo(() => {
  if (!detectedHoliday) return false;
  return rules.some(r => 
    r.recipient_id === deliveryGroup.connectionId && 
    r.date_type === detectedHoliday.key
  );
}, [rules, deliveryGroup.connectionId, detectedHoliday]);

// Show banner if holiday detected, no existing rule, not dismissed
const showUpsellBanner = detectedHoliday && !hasExistingRule && !bannerDismissed;
```

**Render Banner**:
```tsx
{showUpsellBanner && (
  <RecurringGiftUpsellBanner
    deliveryGroup={deliveryGroup}
    detectedHoliday={detectedHoliday}
    cartItems={groupItems}
    onConvert={() => {
      // Open AutoGiftSetupFlow with pre-filled data
      setShowRecurringSetup(true);
    }}
    onDismiss={() => setBannerDismissed(true)}
  />
)}
```

---

## Phase 3: Enhanced Order Confirmation Upsell

### Changes to OrderConfirmation.tsx

**Enhance checkForAutoGiftUpsell**:

The existing function already detects wishlist-based orders. We need to extend it to:
1. Detect holiday-scheduled orders (not just wishlist)
2. Pass product context for AI hints

```typescript
const checkForAutoGiftUpsell = async (orderData: Order) => {
  try {
    // Existing wishlist check
    const isFromWishlist = orderData.cart_data?.source === 'wishlist';
    
    // NEW: Check for holiday-scheduled items
    const scheduledDate = orderData.scheduled_delivery_date;
    const detectedHoliday = scheduledDate 
      ? detectHolidayFromDate(new Date(scheduledDate)) 
      : null;
    
    // Show upsell if: wishlist OR holiday-scheduled
    if (!isFromWishlist && !detectedHoliday) return;
    
    // Get recipient info
    const recipientId = orderData.recipient_id || orderData.cart_data?.wishlist_owner_id;
    const recipientName = orderData.recipient_name || orderData.cart_data?.wishlist_owner_name;
    
    if (!recipientId) return;
    
    // Check for existing rule
    const { data: existingRule } = await supabase
      .from('auto_gift_rules')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq('date_type', detectedHoliday?.key || 'other')
      .single();
    
    if (existingRule) return; // Already has recurring rule
    
    // Build product hints from order items
    const orderItems = getOrderLineItems(orderData);
    const productHints = orderItems.length > 0 ? {
      title: orderItems[0].name,
      brand: orderItems[0].brand,
      category: orderItems[0].category,
      priceRange: [
        Math.floor(orderData.total_amount * 0.8),
        Math.ceil(orderData.total_amount * 1.2)
      ] as [number, number],
      image: orderItems[0].image_url
    } : undefined;
    
    setAutoGiftInitialData({
      recipientId,
      recipientName,
      eventType: detectedHoliday?.key || 'other',
      budgetLimit: Math.ceil(orderData.total_amount),
      productHints // NEW: pass to AutoGiftSetupFlow
    });
  } catch (error) {
    console.error('Error checking for recurring gift upsell:', error);
  }
};
```

**Update Upsell Banner Copy**:

```tsx
{autoGiftInitialData && !showAutoGiftUpsell && (
  <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-pink-50">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 text-purple-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-2">
          Make this a recurring gift for {autoGiftInitialData.recipientName}?
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {autoGiftInitialData.eventType === 'christmas' 
            ? "You just gifted for Christmas! Set up recurring and we'll remind you next December."
            : `Set up recurring gifts and never miss ${autoGiftInitialData.recipientName}'s special occasions.`
          }
        </p>
        <div className="flex gap-3">
          <Button onClick={() => setShowAutoGiftUpsell(true)} className="bg-purple-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Set Up Recurring Gift
          </Button>
          <Button variant="outline" onClick={() => setAutoGiftInitialData(null)}>
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  </Card>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx` | Add "Buy + Recur" dual action when completing recurring flow from product page |
| `src/components/gifting/auto-gift/AutoGiftSetupFlow.tsx` | Add `productHints` prop, save in `gift_selection_criteria` |
| `src/components/cart/RecipientPackagePreview.tsx` | Add holiday detection + upsell banner |
| `src/components/cart/RecurringGiftUpsellBanner.tsx` | **NEW** - Holiday conversion banner for cart |
| `src/pages/OrderConfirmation.tsx` | Enhance upsell detection for holiday orders, update copy |

---

## Component Reuse

| Component | Status | Notes |
|-----------|--------|-------|
| `detectHolidayFromDate` | ✅ Reuse | Already in holidayDates.ts |
| `HolidayConversionBanner` | ✅ Reuse as template | Similar UI for cart banner |
| `AutoGiftSetupFlow` | ✅ Reuse | Add productHints prop |
| `useUnifiedGiftRules` | ✅ Reuse | Check for existing rules |
| `SimpleRecipientSelector` | ✅ Reuse | Already integrated |

---

## User Flow Examples

### Example 1: Product Page → Buy + Recur

1. User browses Apple AirPods ($199)
2. Clicks "Schedule as Gift"
3. Selects "Recurring" mode
4. Chooses Mom, Christmas, $200 budget
5. **RESULT**:
   - AirPods added to cart for Dec 25, 2026 → immediate sale
   - Recurring rule created for Christmas 2027+ with hints: `{ brand: "Apple", category: "Electronics", priceRange: [160, 240] }`

### Example 2: Cart Holiday Detection

1. User manually schedules gift for Dec 25
2. Cart shows: "This is Christmas! Make it recurring?"
3. User clicks "Make Recurring"
4. AutoGiftSetupFlow opens pre-filled with recipient and Christmas

### Example 3: Post-Checkout Upsell

1. User completes checkout for gift scheduled Dec 25
2. Order confirmation shows: "Make this a recurring gift?"
3. User clicks "Set Up Recurring"
4. Rule created with product hints from order items

---

## Technical Considerations

1. **Prevent Duplicate Rules**: Check `useUnifiedGiftRules` before showing banners
2. **Holiday Detection Edge Cases**: Same logic as `HolidayConversionBanner` in modal
3. **Price Range Hints**: Set ±20% of original product price for AI flexibility
4. **Haptic Feedback**: Add `triggerHapticFeedback('success')` on conversions
5. **Analytics**: Track conversion rate from each entry point

---

## Testing Checklist

1. **Product Page Buy + Recur**
   - [ ] Product added to cart when completing recurring setup
   - [ ] Rule created with product hints
   - [ ] Toast shows dual success message

2. **Cart Holiday Banner**
   - [ ] Banner appears when package scheduled for holiday
   - [ ] Banner hidden if rule already exists
   - [ ] Dismiss persists during session

3. **Order Confirmation Upsell**
   - [ ] Shows for holiday-scheduled orders
   - [ ] Hidden if recurring rule exists
   - [ ] Product hints passed to setup flow

