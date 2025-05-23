
/**
 * Utilities for wishlist category handling.
 */

// NEW: sanitize category array—returns deduped, trimmed, sorted valid categories
export function sanitizeCategories(categories: unknown[]): string[] {
  if (!Array.isArray(categories)) return [];
  const set = new Set<string>();
  for (const cat of categories) {
    if (typeof cat === "string") {
      const trimmed = cat.trim();
      if (trimmed.length > 0) set.add(trimmed);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Returns a deduplicated, sorted array of non-empty, trimmed category strings from wishlist objects.
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

