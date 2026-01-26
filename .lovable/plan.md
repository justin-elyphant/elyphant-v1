
# Unify Recurring Gift Rules Display: Reuse Existing Components

## Problem Summary

The `ActiveRulesSection` component (163 lines) is a flat list of rule cards that duplicates functionality already built into `RecipientGiftCard` + `MyGiftsDashboardSimplified`. This creates:
- **Visual inconsistency**: `/recurring-gifts` page shows flat cards while dashboard shows grouped avatars
- **Code duplication**: Same toggle, delete, edit logic in 2 places
- **Missing features**: `ActiveRulesSection` lacks inline budget editing, better UX

## Solution: Replace ActiveRulesSection with Existing Components

Instead of building new grouping logic, **delete `ActiveRulesSection`** and reuse the already-built pattern from `MyGiftsDashboardSimplified`.

---

## Implementation Plan

### Phase 1: Extract Reusable Grouped Rules Component

**Create: `src/components/gifting/unified/GroupedRulesSection.tsx`**

Extract the grouping logic + `RecipientGiftCard` usage from `MyGiftsDashboardSimplified` into a standalone component:

```text
GroupedRulesSection (new extracted component)
├── Title: "Active Recurring Gift Rules" (configurable)
├── Grouping logic (from MyGiftsDashboardSimplified lines 88-110)
└── Maps to RecipientGiftCard (already exists)
    ├── Avatar + recipient name + occasion count
    ├── Collapsible list of OccasionRow (already exists)
    │   ├── Toggle switch (is_active)
    │   ├── BudgetEditor (inline editing - already exists)
    │   ├── Advanced Settings button (edit)
    │   └── Remove button (delete)
    └── "Show More" if >3 occasions
```

**Props:**
```typescript
interface GroupedRulesSectionProps {
  rules: UnifiedGiftRule[];
  title?: string;
  description?: string;
  showEmptyState?: boolean;
  onEditRule: (ruleId: string) => void;
  onBudgetUpdate?: (ruleId: string, newBudget: number) => Promise<void>;
}
```

### Phase 2: Update RecurringGifts.tsx Page

**Replace:**
```tsx
// OLD - flat list
<ActiveRulesSection 
  rules={rules} 
  onEditRule={(rule) => {...}}
/>
```

**With:**
```tsx
// NEW - grouped by recipient with avatars
<GroupedRulesSection 
  rules={rules}
  title="Active Recurring Gift Rules"
  description="Manage your recurring gift rules"
  onEditRule={(ruleId) => {...}}
/>
```

### Phase 3: Update AutomatedGiftingTabContent.tsx

Same replacement - swap `ActiveRulesSection` for `GroupedRulesSection`.

### Phase 4: Simplify MyGiftsDashboardSimplified.tsx

Now that `GroupedRulesSection` is extracted, `MyGiftsDashboardSimplified` can import it instead of having inline grouping logic. This removes ~40 lines of duplicate grouping code.

### Phase 5: Delete ActiveRulesSection.tsx

Once all usages are migrated, delete the redundant file.

---

## Component Reuse Summary

| Component | Status | Action |
|-----------|--------|--------|
| `RecipientGiftCard` | ✅ Reuse | No changes needed |
| `OccasionRow` | ✅ Reuse | Already inside RecipientGiftCard |
| `BudgetEditor` | ✅ Reuse | Already used by OccasionRow |
| `getRecipientDisplayName` | ✅ Reuse | Already in helpers |
| `isPendingInvitation` | ✅ Reuse | Already in helpers |
| `ActiveRulesSection` | ❌ Delete | Replaced by GroupedRulesSection |

---

## Files Changed

| File | Action |
|------|--------|
| `src/components/gifting/unified/GroupedRulesSection.tsx` | **Create** - Extract grouping + RecipientGiftCard usage |
| `src/pages/RecurringGifts.tsx` | **Modify** - Import GroupedRulesSection instead of ActiveRulesSection |
| `src/components/gifting/events/automated-tab/AutomatedGiftingTabContent.tsx` | **Modify** - Import GroupedRulesSection |
| `src/components/gifting/unified/MyGiftsDashboardSimplified.tsx` | **Modify** - Import GroupedRulesSection (remove inline grouping) |
| `src/components/gifting/events/automated-tab/ActiveRulesSection.tsx` | **Delete** - No longer needed |

---

## Visual Result

### Before (Flat Cards - Current ActiveRulesSection)
```text
┌─ Birthday for Charles Meeks ─────────────────────┐
│  Budget: $50 │ Source: Wishlist │ [Toggle] [Edit] [Delete]
└──────────────────────────────────────────────────┘

┌─ Christmas for Charles Meeks ────────────────────┐
│  Budget: $50 │ Source: Wishlist │ [Toggle] [Edit] [Delete]
└──────────────────────────────────────────────────┘
```

### After (Grouped with Avatar - Reusing RecipientGiftCard)
```text
┌───────────────────────────────────────────────────────────┐
│  (avatar)  Charles Meeks                    2 occasions ▼ │
│            $100/year                                      │
├───────────────────────────────────────────────────────────┤
│  ┌─ Birthday ──────────────────────────────────────────┐ │
│  │  $50 • Sends annually │ [Toggle] │ [▼ expand]       │ │
│  │  ┌─────────────────────────────────────────────┐    │ │
│  │  │ Up to $50 ✎ │ Wishlist + AI                 │    │ │
│  │  │ [Advanced Settings]  [Remove]               │    │ │
│  │  └─────────────────────────────────────────────┘    │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─ Christmas ─────────────────────────────────────────┐ │
│  │  $50 • Sends Dec 25th │ [Toggle] │ [▼ expand]       │ │
│  └─────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

---

## Technical Details

### Grouping Logic (Already Exists - lines 88-110 of MyGiftsDashboardSimplified)
```typescript
const groupedRules = useMemo(() => {
  const groups = new Map<string, UnifiedGiftRule[]>();
  
  rules.forEach(rule => {
    const key = rule.recipient_id || rule.pending_recipient_email || 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(rule);
  });
  
  return Array.from(groups.entries()).map(([key, recipientRules]) => ({
    recipientKey: key,
    recipientName: getRecipientDisplayName(recipientRules[0]),
    recipientProfileImage: recipientRules[0].recipient?.profile_image,
    isPending: isPendingInvitation(recipientRules[0]),
    rules: recipientRules,
    totalBudget: recipientRules.reduce((sum, r) => sum + (r.budget_limit || 50), 0)
  }));
}, [rules]);
```

This exact logic will be moved into `GroupedRulesSection`.

---

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| Rule display components | 2 (`ActiveRulesSection` + `RecipientGiftCard`) | 1 (`RecipientGiftCard` only) |
| Grouping logic implementations | 2 (MyGiftsDashboardSimplified + new in ActiveRulesSection) | 1 (GroupedRulesSection) |
| Lines in ActiveRulesSection | 163 | 0 (deleted) |
| New GroupedRulesSection | 0 | ~80 (extracted, not new logic) |
| Net lines removed | ~83 lines |

---

## Benefits

1. **Single source of truth** - One component for displaying grouped rules everywhere
2. **Visual consistency** - Same avatar + accordion pattern on `/recurring-gifts` and dashboard
3. **Feature parity** - Inline budget editing now available everywhere (was missing in ActiveRulesSection)
4. **Less code** - Delete 163 lines of duplicate logic
5. **Better UX** - Grouped view reduces clutter when one person has multiple occasions
