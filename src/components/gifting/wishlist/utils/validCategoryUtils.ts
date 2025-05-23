
/**
 * Returns only valid, non-empty, and non-whitespace string categories.
 */
export function getValidCategories(categories: unknown[]): string[] {
  if (!Array.isArray(categories)) return [];
  return categories.filter(
    (cat): cat is string =>
      typeof cat === "string" && cat.trim().length > 0 && cat !== ""
  );
}

/**
 * Logs invalid category values for debugging (dev only).
 */
export function logInvalidCategories(categories: unknown[], label = "Category validation:") {
  categories.forEach((cat, i) => {
    if (typeof cat !== "string" || cat.trim().length === 0 || cat === "") {
      // eslint-disable-next-line no-console
      console.error(`[${label}] Invalid category at index ${i}:`, cat);
    }
  });
}
