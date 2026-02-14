// ============================================================================
// UNSUPPORTED PRODUCT FILTER - Filter out digital, gift cards, Prime Pantry,
// Whole Foods, grocery items, and other Zinc-unfulfillable products.
// ============================================================================

/**
 * Check if a product is unsupported by Zinc fulfillment
 * Returns true if the product should be BLOCKED
 */
export const isUnsupportedProduct = (product: any): boolean => {
  // --- Layer 1: Zinc boolean flags ---
  if (product.digital === true || product.fresh === true || product.pantry === true) {
    return true;
  }

  const title = (product.title || '').toLowerCase();
  const category = (product.category || product.categories?.[0] || '').toLowerCase();

  // --- Layer 2: Gift cards ---
  if (/gift\s*card|e-?gift|egift/i.test(title)) {
    return true;
  }

  // --- Layer 3: Digital products ---
  if (/kindle\s*edition|\[ebook\]|digital\s*(download|code)|online\s*game\s*code|pc\s*download/i.test(title)) {
    return true;
  }
  if (/kindle\s*store|digital\s*music|digital\s*video/i.test(category)) {
    return true;
  }

  // --- Layer 4: Grocery / Whole Foods / Amazon Fresh / Prime Pantry ---

  // 4a: Category-level blocking
  if (/grocery.*gourmet|amazon\s*fresh|prime\s*pantry|whole\s*foods/i.test(category)) {
    return true;
  }

  // 4b: Check ALL categories array entries (Zinc returns breadcrumb array)
  const categories: string[] = product.categories || product.metadata?.categories || [];
  if (Array.isArray(categories)) {
    for (const cat of categories) {
      if (typeof cat === 'string' &&
          /grocery.*gourmet|amazon\s*fresh|prime\s*pantry|whole\s*foods/i.test(cat)) {
        return true;
      }
    }
  }

  // 4c: Seller / fulfillment source detection
  const sellerFields = [
    product.seller_name,
    product.sold_by,
    product.fulfilled_by,
    product.merchant_name,
    product.metadata?.seller_name,
    product.metadata?.sold_by,
    product.metadata?.fulfilled_by,
  ];
  for (const field of sellerFields) {
    if (typeof field === 'string' && /whole\s*foods/i.test(field)) {
      return true;
    }
  }

  return false;
};

/**
 * Filter out unsupported products from results
 */
export const filterUnsupportedProducts = (products: any[]): {
  filteredProducts: any[];
  blockedCount: number;
} => {
  if (!products || products.length === 0) {
    return { filteredProducts: [], blockedCount: 0 };
  }

  let blockedCount = 0;

  const filteredProducts = products.filter(product => {
    if (isUnsupportedProduct(product)) {
      blockedCount++;
      return false;
    }
    return true;
  });

  if (blockedCount > 0) {
    console.log(`🎯 Unsupported product filter: ${products.length} → ${filteredProducts.length} products (blocked ${blockedCount})`);
  }

  return { filteredProducts, blockedCount };
};
