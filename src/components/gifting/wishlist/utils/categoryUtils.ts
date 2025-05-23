
/**
 * Utilities for wishlist category handling.
 */

/**
 * Returns a deduplicated, sorted array of non-empty, trimmed category strings.
 */
export function getValidWishlistCategories(wishlists: { category?: string }[]): string[] {
  if (!Array.isArray(wishlists) || wishlists.length === 0) return [];
  const set = new Set<string>();
  for (const wl of wishlists) {
    if (typeof wl.category === "string") {
      const trimmed = wl.category.trim();
      if (trimmed.length > 0) set.add(trimmed);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
