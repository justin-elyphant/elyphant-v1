
# Desktop Wishlist "Purchased" Badge & Progress Ring Implementation

## Problem Summary

Based on the screenshots and code analysis, there are **two distinct missing features** on desktop:

1. **Missing "Purchased" Badge on Profile Page** - The "My Wishlist Items" section (`SocialProductGrid.tsx` → `ResponsiveProductGrid.tsx`) doesn't display the "Purchased" badge for items that have been bought
2. **Missing Per-Wishlist Progress Ring on Wishlists Page** - The individual wishlist cards (`UnifiedWishlistCollectionCard.tsx`) don't show the circular progress ring indicating purchase percentage that appears on mobile/tablet

---

## Technical Analysis

### Issue 1: Profile Page "My Wishlist Items" - No Purchase Status

**Files Affected:**
- `src/components/user-profile/SocialProductGrid.tsx`
- `src/components/user-profile/ResponsiveProductGrid.tsx`

**Root Cause:**
- `SocialProductGrid.tsx` fetches wishlist items directly from the database (lines 64-118)
- It converts them to `ProductWithSource` objects (lines 170-194)
- `ResponsiveProductGrid.tsx` receives these products but has **no awareness of purchase status**
- The component only displays source badges (Wishlist, AI, Trending) but not purchased status

**Fix Required:**
1. Fetch purchased item IDs in `SocialProductGrid.tsx` using the existing `useWishlistPurchasedItems` hook pattern
2. Pass `purchasedItemIds` to `ResponsiveProductGrid.tsx`
3. Add "Purchased" badge rendering in `ResponsiveProductGrid.tsx` for items where `purchasedItemIds.has(item.product_id)`

### Issue 2: Wishlists Page - No Progress Ring on Desktop Cards

**Files Affected:**
- `src/components/gifting/wishlist/UnifiedWishlistCollectionCard.tsx`

**Root Cause:**
- The `UnifiedWishlistCollectionCard` component displays:
  - 2x2 image grid
  - Item count badge
  - Privacy toggle
  - Title and description
- It does **NOT** include any purchase progress indicator
- The circular "100% gifted" ring visible in screenshots is not implemented in the code

**Fix Required:**
1. Calculate purchase percentage per wishlist using `WishlistPurchaseTrackingService`
2. Add a circular progress ring around the image area showing gift completion percentage
3. Show this on all variants (mobile, tablet, desktop)

---

## Implementation Plan

### Part 1: Add "Purchased" Badge to Profile Page Wishlist Items

#### Step 1.1: Update SocialProductGrid.tsx
- Import the `WishlistPurchaseTrackingService` or query `wishlist_item_purchases` directly
- Fetch purchased item IDs for all visible wishlist items
- Extend the `ProductWithSource` interface to include `isPurchased` flag
- Map the flag when extracting wishlist products

#### Step 1.2: Update ResponsiveProductGrid.tsx
- Accept `purchasedItemIds` prop (Set of item IDs)
- Add "Purchased" badge rendering for wishlist items
- Add reduced opacity styling for purchased items
- Desktop: Badge positioned at top-left with green CheckCircle icon
- Mobile: Same positioning with smaller badge

**UI Pattern (matching EnhancedWishlistCard):**
```tsx
{isPurchased && (
  <Badge className="absolute top-2 left-2 z-10 text-xs bg-green-500 text-white border-green-600">
    <CheckCircle2 className="h-3 w-3 mr-1" />
    Purchased
  </Badge>
)}
```

### Part 2: Add Circular Progress Ring to Wishlist Cards

#### Step 2.1: Create WishlistProgressRing Component
- New file: `src/components/gifting/wishlist/WishlistProgressRing.tsx`
- SVG-based circular progress indicator
- Accepts `percentage` (0-100) and `size` props
- Uses purple/pink gradient for the progress arc
- Shows percentage text in center when > 0%

#### Step 2.2: Update UnifiedWishlistCollectionCard.tsx
- Fetch purchase stats per wishlist using the existing service
- Wrap the image grid area with the progress ring
- Ring shows purchase completion percentage
- "100% Gifted" indicator when all items purchased

**UI Pattern:**
```tsx
<div className="relative aspect-square">
  {/* Progress Ring - wraps the entire image area */}
  <WishlistProgressRing percentage={purchasePercentage} className="absolute inset-0" />
  
  {/* Existing image grid content */}
  {renderImageGrid()}
</div>
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/gifting/wishlist/WishlistProgressRing.tsx` | **Create** | SVG circular progress ring component |
| `src/components/user-profile/SocialProductGrid.tsx` | Modify | Fetch purchased item IDs, pass to ResponsiveProductGrid |
| `src/components/user-profile/ResponsiveProductGrid.tsx` | Modify | Add purchasedItemIds prop, render "Purchased" badge |
| `src/components/gifting/wishlist/UnifiedWishlistCollectionCard.tsx` | Modify | Add progress ring and per-wishlist purchase tracking |

---

## Testing Checklist

After implementation:
1. **Profile Page Test:**
   - Navigate to `/profile`
   - Find "My Wishlist Items" section
   - Verify purchased items show green "Purchased" badge
   - Verify non-purchased items don't show badge

2. **Wishlists Page Test:**
   - Navigate to `/wishlists`
   - Verify each wishlist card shows circular progress ring
   - Verify "Test wishlist for recourring gifting" shows 100% (purple ring)
   - Check mobile, tablet, and desktop views

3. **Wishlist Detail Test:**
   - Navigate to `/wishlist/df35823f-84f3-4804-a816-21b6e8cb1b26`
   - Verify the iPhone case shows "Purchased" badge

4. **Public Profile Test:**
   - View the wishlist as a guest/connection
   - Verify purchased items show status and prevent duplicate purchase
