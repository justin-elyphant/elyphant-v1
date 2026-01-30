

# Wishlist Header Lululemon Design Alignment Plan

## Overview

Align the wishlist header and related components with the established Lululemon-inspired monochromatic design system. This means using a clean white/grey foundation with the brand gradient (`bg-elyphant-gradient`) reserved ONLY for primary CTAs.

## Current Issues

| Element | Current State | Problem |
|---------|---------------|---------|
| Header Background | `bg-gradient-to-r from-background via-primary/5 to-background` | Purple tint violates monochromatic rule |
| Privacy Toggle (Public) | `bg-emerald-100 text-emerald-700` | Green color not in monochromatic palette |
| Add Items Button | Default blue `primary` color | Should use `bg-elyphant-gradient` for primary CTA |
| View Mode Toggles | `variant="default"` (blue) for active state | Should use monochromatic grey/white active state |

## Target State (Lululemon Pattern)

- **Backgrounds**: Clean `bg-background` or `bg-white` - no colored tints
- **Privacy Badge**: Monochromatic grey for both states (public/private) with subtle icon differentiation
- **Primary CTA**: `bg-elyphant-gradient text-white` for Add Items button
- **Functional Toggles**: `bg-background` with `shadow-sm` for active state (like iOS segmented controls)

---

## Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `WishlistWorkspaceHeader.tsx` | Modify | Remove purple tint, apply gradient to CTA |
| `InlinePrivacyToggle.tsx` | Modify | Convert to monochromatic styling |
| `WishlistItemsGrid.tsx` | Modify | Make view toggles monochromatic |

---

## Detailed Changes

### 1. WishlistWorkspaceHeader.tsx

**Background Fix (Line 70):**
```typescript
// BEFORE:
className="border-b border-border bg-gradient-to-r from-background via-primary/5 to-background shadow-sm"

// AFTER (clean monochromatic):
className="border-b border-border bg-background shadow-sm"
```

**Add Items Button Fix (Line 141):**
```typescript
// BEFORE:
<Button onClick={onAddItems} size="lg" className="gap-2 font-semibold shadow-md">

// AFTER (brand gradient for primary CTA):
<Button onClick={onAddItems} size="lg" className="gap-2 font-semibold shadow-md bg-elyphant-gradient text-white hover:opacity-90">
```

**Avatar Fallback Fix (Line 98):**
```typescript
// BEFORE:
className="... bg-primary/10 ... text-primary"

// AFTER (monochromatic):
className="... bg-muted ... text-muted-foreground"
```

### 2. InlinePrivacyToggle.tsx

Convert from green/grey to pure monochromatic with subtle visual differentiation:

**Lines 47-49:**
```typescript
// BEFORE:
isPublic 
  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" 
  : "bg-muted text-muted-foreground hover:bg-muted/80"

// AFTER (monochromatic - both states grey, public has subtle border):
isPublic 
  ? "bg-muted text-foreground hover:bg-muted/80 border border-border" 
  : "bg-muted text-muted-foreground hover:bg-muted/80"
```

This makes both states monochromatic while keeping public visually distinct via:
- **Public**: `text-foreground` (darker text) + visible border
- **Private**: `text-muted-foreground` (lighter text) + no border

### 3. WishlistItemsGrid.tsx

**Desktop View Toggle (Lines 191-209):**
```typescript
// BEFORE:
<Button
  variant={viewMode === 'grouped' ? 'default' : 'ghost'}  // Blue when active
  ...
>

// AFTER (monochromatic - white/shadow when active):
<Button
  variant="ghost"
  size="sm"
  onClick={() => setViewMode('grouped')}
  className={cn(
    "gap-2",
    viewMode === 'grouped' && "bg-background shadow-sm"
  )}
>
```

**Mobile View Toggle (Lines 167-187):**
Already monochromatic (`bg-background shadow-sm` for active) - no changes needed.

---

## Visual Comparison

### Header

```
BEFORE:
┌─────────────────────────────────────────────────┐
│  ← Back    [Switcher]           [+ Add Items]  │  ← Purple tint, blue button
│  👤 Wishlist Title  [🌐 Public]   47 items     │  ← Green privacy badge
└─────────────────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────────────────┐
│  ← Back    [Switcher]           [+ Add Items]  │  ← Clean white, gradient button
│  👤 Wishlist Title  [🌐 Public]   47 items     │  ← Grey privacy badge
└─────────────────────────────────────────────────┘
```

### Privacy Toggle States

```
BEFORE:
┌──────────────┐    ┌──────────────┐
│ 🌐 Public    │    │ 🔒 Private   │
│ GREEN bg     │    │ GREY bg      │
└──────────────┘    └──────────────┘

AFTER:
┌──────────────┐    ┌──────────────┐
│ 🌐 Public    │    │ 🔒 Private   │
│ GREY + border│    │ GREY muted   │
└──────────────┘    └──────────────┘
```

---

## iOS Capacitor Compliance

All changes preserve existing iOS best practices:
- ✅ 44px minimum touch targets maintained
- ✅ `triggerHapticFeedback` calls unchanged
- ✅ `active:scale-95` feedback preserved
- ✅ Safe area padding unchanged
- ✅ `touch-manipulation` class preserved

---

## Component Dependencies

No new components created. Reusing existing design tokens:
- `bg-elyphant-gradient` (tailwind.config.ts line 23)
- `bg-muted`, `text-muted-foreground` (standard design system)
- `bg-background`, `shadow-sm` (standard design system)

---

## Technical Implementation Summary

| Component | Lines Changed | Change Type |
|-----------|---------------|-------------|
| `WishlistWorkspaceHeader.tsx` | 70, 98, 141 | Class name updates |
| `InlinePrivacyToggle.tsx` | 47-49 | Class name updates |
| `WishlistItemsGrid.tsx` | 191-209 | Variant to className conversion |

Total: ~15 lines of styling changes across 3 files

