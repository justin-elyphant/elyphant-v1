

# Improve Auto-Approve Toggle Explanation

## Problem

The current "Auto-approve gifts" toggle shows minimal context:
```
Auto-approve gifts
Skip approval and send automatically
```

Users don't understand the email approval flow or what "skip approval" actually means in practice.

---

## The Actual Flow (From `auto-gift-orchestrator`)

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     AUTO-APPROVE OFF (Default)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   T-7 days         Email Sent           Your Action                 │
│   ─────────   →   ────────────────   →  ────────────               │
│   7 days          "Nicole AI picked     [Approve ✓]                │
│   before          a $45 gift for        [Skip ✗]                   │
│   event           Mom's Birthday"                                   │
│                                                                     │
│   If Approved → Payment captured → Gift shipped                     │
│   If Skipped  → No charge, gift not sent                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      AUTO-APPROVE ON                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   T-7 days         Automatic                                        │
│   ─────────   →   ────────────                                     │
│   7 days          Nicole picks gift                                │
│   before          Payment captured                                  │
│   event           Order placed                                      │
│                                                                     │
│   ⚠️ Safety: Gifts over $75 still require manual approval          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Solution

Update `RecurringToggleSection.tsx` to show **dynamic descriptions** based on toggle state:

### Current Code (Lines 249-264):
```tsx
<div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 min-h-[52px]">
  <div>
    <p className="text-sm font-medium">Auto-approve gifts</p>
    <p className="text-xs text-muted-foreground">
      Skip approval and send automatically
    </p>
  </div>
  <Switch ... />
</div>
```

### Updated Code:
```tsx
<div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 min-h-[56px]">
  <div className="flex-1 pr-3">
    <p className="text-sm font-medium">Auto-approve gifts</p>
    <p className="text-xs text-muted-foreground">
      {autoApprove 
        ? "Gifts will be purchased automatically. Gifts over $75 still need approval."
        : "We'll email you 7 days before with Nicole's pick. Approve or skip with one click."
      }
    </p>
  </div>
  <Switch ... />
</div>
```

---

## Visual Mockup

**Toggle OFF (Default):**
```text
┌────────────────────────────────────────────────────────────┐
│  Auto-approve gifts                                   [○ ] │
│  We'll email you 7 days before with Nicole's pick.         │
│  Approve or skip with one click.                           │
└────────────────────────────────────────────────────────────┘
```

**Toggle ON:**
```text
┌────────────────────────────────────────────────────────────┐
│  Auto-approve gifts                                   [●─] │
│  Gifts will be purchased automatically.                    │
│  Gifts over $75 still need approval.                       │
└────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/gifting/unified/RecurringToggleSection.tsx` | Update description text (lines 252-255) to be dynamic based on `autoApprove` state |

---

## Technical Details

The `$75 threshold` comes from `UnifiedGiftManagementService.ts` line 2295:
```typescript
if (totalAmount > 75) return true; // requiresApproval = true
```

This safety rule means even with auto-approve ON, high-value gifts still get the email flow.

