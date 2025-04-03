
import { ZincProduct } from '../types';
import { allProducts, specificProducts } from '../data/mockProducts';

/**
 * Finds products that match the search query
 */
export const findMatchingProducts = (query: string): ZincProduct[] => {
  const lowercaseQuery = query.toLowerCase();
  
  // Normalize query - support both "Nike Shoes" and "nike shoes"
  const normalizedQuery = lowercaseQuery.trim();
  
  console.log(`SearchUtils: Searching for "${normalizedQuery}"`);
  
  // Direct matching for common searches
  if (normalizedQuery === "nike shoes" || 
      normalizedQuery === "nike shoe" || 
      (normalizedQuery.includes("nike") && normalizedQuery.includes("shoe"))) {
    console.log(`SearchUtils: Found special match for Nike Shoes`);
    return specificProducts["nike shoes"] || [];
  }
  
  // Check for well-known brands and products
  const wellKnownTerms = {
    "dallas": "dallas cowboys",
    "cowboys": "dallas cowboys",
    "iphone": "apple iphone",
    "samsung": "samsung galaxy",
    "playstation": "sony playstation",
    "xbox": "microsoft xbox",
    "adidas": "adidas shoes",
    "puma": "puma shoes"
  };
  
  // Check if query includes any of our well-known terms
  for (const term in wellKnownTerms) {
    if (normalizedQuery.includes(term)) {
      const mappedTerm = wellKnownTerms[term as keyof typeof wellKnownTerms];
      console.log(`SearchUtils: Mapping "${term}" to "${mappedTerm}"`);
      
      // If we have specific products for this term, return them
      if (specificProducts[mappedTerm]) {
        return specificProducts[mappedTerm];
      }
      
      // If not, let's create some fallback results for common searches
      if (mappedTerm === "dallas cowboys") {
        return createMockResults("Dallas Cowboys", "Sports", 12);
      } else if (mappedTerm.includes("shoes")) {
        return createMockResults(mappedTerm, "Footwear", 12);
      } else if (mappedTerm.includes("samsung") || mappedTerm.includes("iphone")) {
        return createMockResults(mappedTerm, "Electronics", 12);
      } else if (mappedTerm.includes("xbox") || mappedTerm.includes("playstation")) {
        return createMockResults(mappedTerm, "Gaming", 12);
      }
    }
  }
  
  // Check for exact matches in our specific products
  for (const key in specificProducts) {
    if (key === normalizedQuery) {
      console.log(`SearchUtils: Found exact match for "${normalizedQuery}" in specific products`);
      return specificProducts[key];
    }
  }
  
  // Check for partial matches that might be close but not exact
  for (const key in specificProducts) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      console.log(`SearchUtils: Found partial match for "${normalizedQuery}" in specific products key "${key}"`);
      return specificProducts[key];
    }
  }
  
  // Check word by word
  const queryTerms = normalizedQuery.split(' ');
  for (const key in specificProducts) {
    const keyTerms = key.split(' ');
    
    // Check if enough terms match between the query and the key
    const matchingTerms = queryTerms.filter(term => 
      keyTerms.some(keyTerm => keyTerm.includes(term) || term.includes(keyTerm))
    );
    
    if (matchingTerms.length >= Math.min(2, queryTerms.length)) {
      console.log(`SearchUtils: Found term match for "${normalizedQuery}" in specific products key "${key}"`);
      return specificProducts[key];
    }
  }
  
  // Filter products based on query
  let results = allProducts.filter(product => 
    product.title.toLowerCase().includes(normalizedQuery) || 
    (product.description && product.description.toLowerCase().includes(normalizedQuery)) ||
    (product.category && product.category.toLowerCase().includes(normalizedQuery)) ||
    (product.brand && product.brand.toLowerCase().includes(normalizedQuery))
  );
  
  // Check for brand-specific searches (like "Nike")
  if (results.length === 0 && normalizedQuery.includes('nike')) {
    console.log(`SearchUtils: Using fallback for Nike-related search`);
    return specificProducts['nike shoes'] || [];
  }
  
  // Generic fallback: if we have no results but have a common term, create mock results
  if (results.length === 0) {
    for (const term of queryTerms) {
      if (term.length > 3) { // Only consider meaningful terms
        // Create mock results for longer search terms
        const fallbackResults = createMockResults(normalizedQuery, guessCategory(normalizedQuery), 12);
        if (fallbackResults.length > 0) {
          console.log(`SearchUtils: Created ${fallbackResults.length} fallback results for "${normalizedQuery}"`);
          return fallbackResults;
        }
      }
    }
  }
  
  // If no results, return empty array instead of default items
  if (results.length === 0) {
    console.log(`SearchUtils: No matches found, returning empty array`);
    return [];
  }
  
  console.log(`SearchUtils: Returning ${results.length} results`);
  return results;
};

/**
 * Helper function to create mock results for a search term
 */
function createMockResults(term: string, category: string, count = 10): ZincProduct[] {
  const capitalize = (s: string) => s.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const brands = ['Amazon Basics', 'Top Brand', 'Quality Seller', 'Premium Choice'];
  const results: ZincProduct[] = [];
  
  // Generate more realistic product images based on category
  const getProductImage = (category: string, index: number): string => {
    const baseImageUrls = {
      'Footwear': [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80',
        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80',
      ],
      'Electronics': [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80',
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500&q=80',
      ],
      'Gaming': [
        'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&q=80',
        'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=500&q=80',
        'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=500&q=80',
      ],
      'Sports': [
        'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=500&q=80',
        'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=500&q=80',
        'https://images.unsplash.com/photo-1511886929837-354d1a107698?w=500&q=80',
      ]
    };
    
    // Use category-specific images if available
    if (baseImageUrls[category as keyof typeof baseImageUrls]) {
      const images = baseImageUrls[category as keyof typeof baseImageUrls];
      return images[index % images.length];
    }
    
    // Default fallback images
    const defaultImages = [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&q=80',
      'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=500&q=80',
    ];
    
    return defaultImages[index % defaultImages.length];
  };
  
  for (let i = 0; i < count; i++) {
    const brand = brands[i % brands.length];
    // Fix: Convert the calculation to a number first, then use toFixed
    const price = 19.99 + (i * 10) + parseFloat((Math.random() * 5).toFixed(2));
    
    results.push({
      product_id: `mock-${term.replace(/\s+/g, '-')}-${i}`,
      title: `${brand} ${capitalize(term)} ${getSuffix(category, i)}`,
      price: parseFloat(price.toFixed(2)),
      image: getProductImage(category, i),
      description: `High quality ${term.toLowerCase()} ${getSuffix(category, i).toLowerCase()} for all your needs. Perfect for ${getUseCase(category)}. Features premium materials and exceptional craftsmanship.`,
      category: category,
      retailer: "Amazon via Zinc",
      brand: brand
    });
  }
  
  return results;
}

/**
 * Helper to guess a product category from search term
 */
function guessCategory(term: string): string {
  term = term.toLowerCase();
  
  if (term.includes('shoe') || term.includes('sneaker') || term.includes('boots')) {
    return 'Footwear';
  } else if (term.includes('shirt') || term.includes('jacket') || term.includes('pant') || term.includes('dress')) {
    return 'Clothing';
  } else if (term.includes('phone') || term.includes('laptop') || term.includes('computer') || term.includes('tablet')) {
    return 'Electronics';
  } else if (term.includes('game') || term.includes('xbox') || term.includes('playstation') || term.includes('nintendo')) {
    return 'Gaming';
  } else if (term.includes('book') || term.includes('novel')) {
    return 'Books';
  } else if (term.includes('tool') || term.includes('drill') || term.includes('saw')) {
    return 'Tools';
  } else if (term.includes('kitchen') || term.includes('cookware') || term.includes('appliance')) {
    return 'Kitchen';
  } else if (term.includes('toy') || term.includes('doll') || term.includes('lego')) {
    return 'Toys';
  } else if (term.includes('cowboys') || term.includes('sports') || term.includes('team') || term.includes('jersey')) {
    return 'Sports';
  }
  
  return 'General';
}

/**
 * Get a relevant suffix for product titles
 */
function getSuffix(category: string, index: number): string {
  const suffixes: Record<string, string[]> = {
    'Footwear': ['Athletic Shoes', 'Casual Sneakers', 'Running Shoes', 'Walking Shoes', 'Comfort Fit'],
    'Clothing': ['T-Shirt', 'Jacket', 'Hoodie', 'Sweatshirt', 'Premium Apparel'],
    'Electronics': ['Smartphone', 'Accessory', 'Charger', 'Case', 'Screen Protector'],
    'Gaming': ['Controller', 'Game', 'Accessory', 'Headset', 'Console'],
    'Sports': ['Jersey', 'Fan Gear', 'Collectible', 'Team Hat', 'Memorabilia'],
    'Books': ['Bestseller', 'Paperback', 'Hardcover', 'Illustrated Edition', 'Collector Edition'],
    'Tools': ['Pro Kit', 'DIY Set', 'Premium Tool', 'Workshop Essential', 'Contractor Grade'],
    'Kitchen': ['Appliance', 'Cookware', 'Set', 'Premium Edition', 'Professional'],
    'Toys': ['Playset', 'Collection', 'Interactive', 'Educational', 'Limited Edition']
  };
  
  const defaultSuffixes = ['Essential', 'Premium', 'Professional', 'Standard', 'Deluxe'];
  const categorySpecificSuffixes = suffixes[category] || defaultSuffixes;
  
  return categorySpecificSuffixes[index % categorySpecificSuffixes.length];
}

/**
 * Get a relevant use case based on category
 */
function getUseCase(category: string): string {
  switch (category) {
    case 'Footwear': return 'everyday wear, sports, and casual outings';
    case 'Clothing': return 'casual and formal occasions';
    case 'Electronics': return 'work, entertainment, and staying connected';
    case 'Gaming': return 'gaming enthusiasts and casual players';
    case 'Sports': return 'fans and sports enthusiasts';
    case 'Books': return 'reading enthusiasts and collectors';
    case 'Tools': return 'DIY projects and professional work';
    case 'Kitchen': return 'cooking enthusiasts and professional chefs';
    case 'Toys': return 'children and collectors';
    default: return 'daily use and special occasions';
  }
}
