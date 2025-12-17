// ============================================================================
// UNSUPPORTED PRODUCT FILTER - Filter out digital, gift cards, Prime Pantry, etc.
// ============================================================================

/**
 * Check if a product is unsupported by Zinc fulfillment
 * Returns true if the product should be BLOCKED
 */
export const isUnsupportedProduct = (product: any): boolean => {
  // Check Zinc boolean flags
  if (product.digital === true || product.fresh === true || product.pantry === true) {
    return true;
  }
  
  const title = (product.title || '').toLowerCase();
  const category = (product.category || product.categories?.[0] || '').toLowerCase();
  
  // Gift cards
  if (/gift\s*card|e-?gift|egift/i.test(title)) {
    return true;
  }
  
  // Digital products
  if (/kindle\s*edition|\[ebook\]|digital\s*(download|code)|online\s*game\s*code|pc\s*download/i.test(title)) {
    return true;
  }
  
  // Digital categories
  if (/kindle\s*store|digital\s*music|digital\s*video/i.test(category)) {
    return true;
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
