

## Make Wishlists Public by Default

### Why
The `/wishlists` route now serves as the social profile hub. Defaulting wishlists to public aligns with the "maximum sharing" privacy model already established for interests and wishlist visibility. Users can still toggle individual wishlists to private.

### Changes

**5 files — flip `is_public: false` → `is_public: true`:**

1. **`src/components/gifting/hooks/operations/useWishlistCreate.tsx`** (line 48) — primary creation hook
2. **`src/hooks/useUnifiedWishlistSystem.tsx`** (line 198) — unified system default wishlist
3. **`src/components/gifting/hooks/useWishlistState.tsx`** (lines 163, 191) — auto-generated wishlists from profile products and empty default
4. **`src/components/marketplace/hooks/utils/wishlists.ts`** (line 30) — marketplace wishlist helper

Each is a single-line change from `false` to `true`.

**No other changes needed** — the share toggle, privacy enforcement in `UnifiedGiftManagementService`, and visitor-mode read-only logic all already handle `is_public: true` correctly.

