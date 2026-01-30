

# Wishlist Page Simplification Plan

## Overview

Transform the current "workbench" wishlist UI into a clean, traditional e-commerce wishlist experience (Lululemon-inspired) while preserving iOS Capacitor best practices and reusing existing proven components.

## Current Problems

1. **340px Sidebar** - Takes significant space, contains duplicated controls (Share, Preview, Settings), analytics-style widgets (gift progress tracker, category breakdown), and repeats owner info already in header
2. **Duplicated Actions** - Privacy toggle, Share, Preview as Guest appear in BOTH header AND sidebar
3. **Dashboard Feel** - Progress trackers and stats feel like analytics, not e-commerce
4. **3-Column Layout** - Sidebar + Items Grid + Shopping Panel creates visual complexity

## Target State (Lululemon Pattern)

- **Simple header** with title, item count, privacy toggle, share, and add button
- **Full-width product grid** with clean item cards
- **Mobile action bar** (existing) for touch-optimized controls
- **No sidebar** for individual wishlist view

## Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `WishlistWorkspace.tsx` | Modify | Remove sidebar, simplify layout |
| `WishlistWorkspaceHeader.tsx` | Modify | Consolidate all controls into header, remove redundancy |
| `WishlistSidebar.tsx` | Keep (no changes) | May be used elsewhere, but not rendered |
| `MobileWishlistActionBar.tsx` | Minor tweak | Ensure tablet support (<1024px) |

---

## Detailed Changes

### 1. WishlistWorkspace.tsx

**Remove:**
- Sidebar rendering entirely (lines 296-307)
- Category filtering state and logic (not needed without sidebar)
- `selectedCategory` state and filtering

**Simplify:**
- Remove the `flex gap-8` layout with sidebar
- Make content area full-width
- Keep ShoppingPanel (slide-in drawer - works well)
- Keep MobileWishlistActionBar (show for mobile AND tablet, <1024px)

**Layout Change:**
```
BEFORE:
┌──────────────────────────────────────────────────────┐
│ Header (with duplicated controls)                    │
├────────────┬─────────────────────────────────────────┤
│  Sidebar   │  Product Grid                           │
│  (340px)   │                                         │
│  - Avatar  │                                         │
│  - Stats   │                                         │
│  - Actions │                                         │
│  - Filters │                                         │
└────────────┴─────────────────────────────────────────┘

AFTER:
┌──────────────────────────────────────────────────────┐
│ Header (clean: title, count, privacy, share, add)    │
├──────────────────────────────────────────────────────┤
│                                                      │
│              Full-Width Product Grid                 │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 2. WishlistWorkspaceHeader.tsx

**Consolidate Controls:**
- Keep back button and wishlist switcher (useful)
- Keep owner avatar + title + item count + total value
- Move InlinePrivacyToggle next to title (already done for desktop, ensure visible)
- Keep Share and Add Items buttons (desktop only)
- Remove Settings button (not implemented anyway, shows "coming soon")
- Remove "Preview as Guest" button (rarely used, confusing)

**Tablet Optimization (<1024px):**
- Show mobile action bar for tablets, not just phones
- Header shows minimal info (title, back button)
- Actions move to bottom action bar

### 3. MobileWishlistActionBar.tsx

**Extend to Tablets:**
- Currently shown only when `isMobile` (default 768px)
- Change to `isMobile(1024)` to include tablets
- This aligns with the project's tablet-as-mobile-shell strategy

### 4. WishlistItemsGrid.tsx

**No major changes needed** - already clean

Minor refinements:
- Remove view mode toggle if categories not used (or keep as grouping is still useful)
- Grid already handles responsive layout well

---

## iOS Capacitor Compliance (Already Present, Verified)

- ✅ 44px minimum touch targets in MobileWishlistActionBar
- ✅ `triggerHapticFeedback` on all interactions
- ✅ Safe area padding (`env(safe-area-inset-bottom)`)
- ✅ Backdrop blur on floating elements
- ✅ `touch-manipulation` class for button responsiveness
- ✅ `active:scale-95` feedback on buttons

---

## Component Reuse (Zero New Components)

| Existing Component | Reused For |
|--------------------|------------|
| `InlinePrivacyToggle` | Privacy toggle in header + action bar |
| `WishlistShareSheet` | Share drawer (mobile/tablet) |
| `MobileWishlistActionBar` | Bottom action bar for mobile + tablet |
| `WishlistItemsGrid` | Main product grid |
| `EnhancedWishlistCard` | Individual product cards |
| `ShoppingPanel` | Add items slide-in drawer |

---

## Safe Cleanup

Files that can be reviewed for potential future cleanup (NOT deleted in this phase):
- `WishlistSidebar.tsx` - No longer rendered but may be used elsewhere
- `CategorySection.tsx` - Still used by WishlistItemsGrid for grouped view
- `WishlistActionToolbar.tsx` - Appears unused (only guest preview banner)

---

## Technical Implementation

### WishlistWorkspace.tsx Changes

```typescript
// REMOVE these lines:
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
// ... selectedCategory URL param handling

// REMOVE sidebar rendering (lines 296-307)

// CHANGE: Extend mobile action bar to tablets
const isMobileOrTablet = useIsMobile(1024);

// SIMPLIFIED LAYOUT:
<div className="px-4 md:px-6 py-6 md:py-8 max-w-[1400px] mx-auto">
  {/* Guest View Notice */}
  {!isOwner && (
    <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
      <p className="text-sm text-center font-medium">
        You're viewing {ownerProfile?.name}'s wishlist
      </p>
    </div>
  )}
  
  <WishlistItemsGrid
    items={wishlist.items}  // No filtering
    onSaveItem={(item) => handleRemoveItem(item.id)}
    savingItemId={isRemoving ? 'removing' : undefined}
    isOwner={isOwner}
    isGuestPreview={isGuestPreview}
  />
</div>

// Mobile/Tablet action bar
{isMobileOrTablet && isOwner && !isGuestPreview && (
  <MobileWishlistActionBar ... />
)}
```

### WishlistWorkspaceHeader.tsx Changes

```typescript
// REMOVE: Guest preview toggle button (lines 155-171)
// REMOVE: Settings button (line 181-183)

// KEEP: Back button, wishlist switcher, avatar, title, privacy toggle, share, add items

// Simplified actions section (desktop only):
{isOwner && !isMobile && !isGuestPreview && (
  <div className="flex items-center gap-2">
    <Button onClick={onAddItems} size="lg" className="gap-2 font-semibold shadow-md">
      <Plus className="h-5 w-5" />
      Add Items
    </Button>
    <Button 
      variant="outline" 
      size="icon"
      onClick={handleShare}
      className="min-h-[44px] min-w-[44px]"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  </div>
)}
```

---

## Responsive Behavior Summary

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥1024px) | Full header with all controls, full-width grid |
| Tablet (768-1023px) | Compact header (back + title), bottom action bar, full-width grid |
| Mobile (<768px) | Minimal header, bottom action bar, stacked grid |

---

## Testing Checklist

After implementation:
1. Desktop: Verify header shows all controls, no sidebar, full-width grid
2. Tablet: Verify bottom action bar appears, header is compact
3. Mobile: Verify existing behavior preserved, action bar visible
4. Privacy toggle: Test public/private switching with haptic feedback
5. Share: Test native share sheet on mobile/tablet
6. Add Items: Test shopping panel opens correctly

