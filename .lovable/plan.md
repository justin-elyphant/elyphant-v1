

# Restore "Set Up Recurring Gift" CTA on /recurring-gifts Page

## Problem Identified

The `/recurring-gifts` page currently has:
- **"Browse Products"** button → Navigates to `/marketplace`
- **"How It Works"** button → Opens explanation modal

Previously, there was also a way to directly set up a recurring gift rule without needing to browse products first. This is important because:
1. Users may want to set up automation first (recipient + occasion + budget) and let Nicole AI handle product selection later
2. The `AutoGiftSetupFlow` modal is already imported and working (used for editing rules) but isn't accessible for new rule creation

## Solution

Add a "Set Up Recurring Gift" button alongside the existing "Browse Products" button in the hero section. This button will open the `AutoGiftSetupFlow` modal in creation mode (not edit mode).

## Implementation Details

### File to Modify

**`src/pages/RecurringGifts.tsx`**

### Changes

1. **Add new state for opening setup flow in create mode**
   - Currently `setupDialogOpen` is tied to `editingRule`, which means it only opens when editing
   - Need to allow opening the dialog with `editingRule = null` for new rule creation

2. **Add "Set Up Recurring Gift" button in hero section**
   - Place it alongside or replace the "Browse Products" button
   - Use the same styling (white button with purple text)
   - Icon: `Gift` or `Plus` icon

3. **Button placement options**
   - **Option A**: Add as a secondary button next to "Browse Products"
   - **Option B**: Replace "Browse Products" with "Set Up Recurring Gift" and move browse to secondary

### Proposed Button Layout

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌──────────────────────────────────┐ │
│  │  Set Up Recurring Gift   │  │  Browse Products                 │ │
│  │  (Primary - Opens Modal) │  │  (Secondary - Links to Shop)     │ │
│  └──────────────────────────┘  └──────────────────────────────────┘ │
│                                                                     │
│  How It Works →                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Code Changes (RecurringGifts.tsx)

**Line 81-91 - Replace/augment the button section:**

```tsx
<div className="flex flex-col sm:flex-row gap-3">
  {/* NEW: Primary CTA - Set Up Recurring Gift */}
  <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
    <Button 
      onClick={() => {
        triggerHapticFeedback('selection');
        setEditingRule(null); // Ensure we're in create mode
        setSetupDialogOpen(true);
      }}
      className="bg-white text-purple-700 hover:bg-white/90 min-h-[44px] font-semibold"
    >
      <Gift className="h-4 w-4 mr-2" />
      Set Up Recurring Gift
    </Button>
  </motion.div>
  
  {/* Existing: Browse Products (now secondary) */}
  <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
    <Button 
      onClick={() => {
        triggerHapticFeedback('selection');
        navigate('/marketplace');
      }}
      variant="ghost"
      className="text-white hover:bg-white/10 min-h-[44px]"
    >
      <ShoppingBag className="h-4 w-4 mr-2" />
      Browse Products
    </Button>
  </motion.div>
</div>
```

**Line 8 - Add Gift icon to imports:**

```tsx
import { Heart, Brain, Sparkles, Calendar, ArrowRight, Settings, ShoppingBag, Gift } from "lucide-react";
```

## User Flow After Implementation

1. User visits `/recurring-gifts`
2. User clicks "Set Up Recurring Gift" in hero
3. `AutoGiftSetupFlow` modal opens with 3-step wizard:
   - Step 1: Choose Recipient & Events
   - Step 2: Set Budget & Payment
   - Step 3: Configure Notifications
4. User completes setup → Rule created
5. Nicole AI handles gift selection and fulfillment at the scheduled time

## Alignment with Existing Memory

- **`memory/marketing/recurring-gifts-branding-standard`**: Uses "Recurring Gifts" terminology ✓
- **`memory/features/recurring-gift-conversion-strategy`**: Supports "Set Up First" flow alongside "Buy Now + Recur Later" ✓
- **`memory/architecture/recurring-gift-unified-pipeline`**: Uses same `auto_gifting_rules` table ✓

