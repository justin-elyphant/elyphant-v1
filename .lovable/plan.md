

## Header Cleanup: Remove Dead Components

### Files to Delete (7 files, zero active imports)

1. **`src/components/home/components/NavigationBar.tsx`** -- Old header bar, only imported by `Header.tsx` (which itself is being replaced)
2. **`src/components/home/Header.tsx`** -- Old header wrapper. Still imported by 4 pages (PaymentCancel, PaymentSuccess, OrderDetail, Crowdfunding) and AdminLayout. These need to be migrated to `UnifiedShopperHeader` first.
3. **`src/components/marketplace/components/MarketplaceTopNav.tsx`** -- Zero imports anywhere. Duplicates cart + favorites already in the unified header.
4. **`src/components/navigation/DesktopHorizontalNav.tsx`** -- Imported in ModernHeaderManager but never rendered in JSX. Dead.
5. **`src/components/navigation/TabletCategoryLinks.tsx`** -- Same situation: imported but never rendered. Dead.
6. **`src/components/layout/navigation/MobileMenu.tsx`** -- Zero imports anywhere. Legacy mobile menu.
7. **`src/components/navigation/components/AuthButtons.tsx`** and **`src/components/navigation/components/NavigationLogo.tsx`** -- Zero imports. Duplicate versions of components that live in `src/components/home/components/`.

### Files to Edit (5 files)

The old `Header.tsx` is still imported by 4 pages and 1 layout. These need to swap to `UnifiedShopperHeader`:

- `src/pages/PaymentCancel.tsx` -- replace `Header` with `UnifiedShopperHeader`
- `src/pages/PaymentSuccess.tsx` -- same
- `src/pages/OrderDetail.tsx` -- same
- `src/pages/Crowdfunding.tsx` -- same
- `src/components/layout/AdminLayout.tsx` -- same

After these swaps, `Header.tsx` and `NavigationBar.tsx` become zero-import and get deleted.

### File to Clean Up (1 file)

- `src/components/navigation/ModernHeaderManager.tsx` -- Remove the unused imports of `DesktopHorizontalNav` and `TabletCategoryLinks` (lines 16, 19)

### Summary

| Action | Files | Lines removed (approx) |
|--------|-------|----------------------|
| Delete dead components | 8 files | ~400 lines |
| Migrate old Header imports | 5 files | ~5 lines each (import swap) |
| Clean unused imports | 1 file | 2 lines |

No visual or functional changes. Every page will use the same unified header after this cleanup.

