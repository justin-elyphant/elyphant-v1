
/**
 * Product validation and filtering utilities
 */
import { ZincProduct } from "../../types";

/**
 * Validate and ensure product has proper image URLs
 */
export const validateProductImages = (product: ZincProduct, query: string): ZincProduct => {
  let validatedProduct = { ...product };
  
  // Generate fallback image if none exists
  if (!validatedProduct.image || validatedProduct.image === '/placeholder.svg') {
    validatedProduct.image = generateFallbackImage(product, query);
    console.log(`Added fallback image for product: ${product.title}`);
  }
  
  // Ensure images array exists
  if (!validatedProduct.images || validatedProduct.images.length === 0) {
    validatedProduct.images = [validatedProduct.image];
    console.log(`Created images array for product: ${product.title}`);
  }
  
  return validatedProduct;
};

/**
 * Generate fallback image based on product category or query
 */
const generateFallbackImage = (product: ZincProduct, query: string): string => {
  const normalizedQuery = query.toLowerCase();
  const productTitle = (product.title || '').toLowerCase();
  
  // Sports team merchandise
  if (normalizedQuery.includes('dallas cowboys') || productTitle.includes('dallas cowboys')) {
    return 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=400&fit=crop';
  }
  
  if (normalizedQuery.includes('padres') || productTitle.includes('padres')) {
    return 'https://images.unsplash.com/photo-1590075865003-e48b276c4579?w=400&h=400&fit=crop';
  }
  
  // Kitchen/cooking related
  if (normalizedQuery.includes('made in') || normalizedQuery.includes('kitchen') || 
      productTitle.includes('kitchen') || productTitle.includes('cookware')) {
    return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop';
  }
  
  // Electronics
  if (normalizedQuery.includes('phone') || normalizedQuery.includes('laptop') || 
      productTitle.includes('electronics')) {
    return 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=400&fit=crop';
  }
  
  // Footwear
  if (normalizedQuery.includes('shoes') || normalizedQuery.includes('sneakers') ||
      productTitle.includes('shoes')) {
    return 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop';
  }
  
  // Default fallback
  return 'https://images.unsplash.com/photo-1560472355-109703aa3edc?w=400&h=400&fit=crop';
};

/**
 * Filter products for relevance to search query
 * Enhanced to be less restrictive for brand and team searches
 */
export const filterRelevantProducts = (products: ZincProduct[], query: string, maxResults: number): ZincProduct[] => {
  if (!products || products.length === 0) {
    console.log('No products to filter');
    return [];
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  console.log(`Filtering ${products.length} products for query: "${normalizedQuery}"`);
  
  // Special case: if query contains specific brands/teams, be more lenient
  const isSpecialQuery = isSpecialBrandOrTeamQuery(normalizedQuery);
  
  const relevantProducts = products.filter(product => {
    const title = (product.title || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    const brand = (product.brand || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    
    // For special queries (teams, brands), use more lenient matching
    if (isSpecialQuery) {
      return isRelevantForSpecialQuery(normalizedQuery, { title, description, brand, category });
    }
    
    // Standard relevance checking
    return isRelevantProduct(normalizedQuery, { title, description, brand, category });
  });
  
  console.log(`Filtered from ${products.length} to ${relevantProducts.length} relevant results`);
  return relevantProducts.slice(0, maxResults);
};

/**
 * Check if query is for a specific brand or team
 */
const isSpecialBrandOrTeamQuery = (query: string): boolean => {
  const specialTerms = [
    'dallas cowboys', 'padres', 'made in', 'nike', 'adidas', 'apple', 'samsung',
    'sony', 'microsoft', 'google', 'amazon', 'under armour', 'puma', 'reebok'
  ];
  
  return specialTerms.some(term => query.includes(term));
};

/**
 * Enhanced relevance check for special brand/team queries
 */
const isRelevantForSpecialQuery = (query: string, product: { title: string; description: string; brand: string; category: string }): boolean => {
  const { title, description, brand, category } = product;
  
  // Direct matches in title or brand
  if (title.includes(query) || brand.includes(query)) {
    return true;
  }
  
  // Specific team/brand logic
  if (query.includes('dallas cowboys')) {
    return title.includes('dallas') || title.includes('cowboys') || 
           brand.includes('dallas') || brand.includes('cowboys') ||
           category.includes('sports') || title.includes('nfl') ||
           title.includes('football') || title.includes('jersey') ||
           title.includes('merchandise');
  }
  
  if (query.includes('made in')) {
    return title.includes('made') || title.includes('kitchen') ||
           title.includes('cookware') || title.includes('utensil') ||
           brand.includes('made in') || category.includes('kitchen') ||
           category.includes('home');
  }
  
  if (query.includes('nike') || query.includes('adidas')) {
    return title.includes('shoe') || title.includes('sneaker') ||
           title.includes('athletic') || title.includes('sport') ||
           category.includes('footwear') || category.includes('sports');
  }
  
  // For other special queries, check partial matches
  const queryWords = query.split(' ');
  return queryWords.some(word => 
    word.length > 2 && (
      title.includes(word) || 
      brand.includes(word) || 
      description.includes(word) ||
      category.includes(word)
    )
  );
};

/**
 * Standard product relevance checking
 */
const isRelevantProduct = (query: string, product: { title: string; description: string; brand: string; category: string }): boolean => {
  const { title, description, brand, category } = product;
  
  // Direct query match
  if (title.includes(query) || description.includes(query) || brand.includes(query)) {
    return true;
  }
  
  // Word-based matching for multi-word queries
  const queryWords = query.split(' ').filter(word => word.length > 2);
  if (queryWords.length === 0) return false;
  
  const matchedWords = queryWords.filter(word =>
    title.includes(word) || 
    description.includes(word) || 
    brand.includes(word) ||
    category.includes(word)
  );
  
  // Require at least half of the meaningful words to match
  return matchedWords.length >= Math.max(1, Math.floor(queryWords.length / 2));
};
