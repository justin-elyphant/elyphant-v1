
/**
 * Enhanced brand detection and categorization utilities
 */

export interface BrandInfo {
  name: string;
  category: string;
  aliases: string[];
  ageGroups: string[];
}

export interface BrandMatch {
  brand: string;
  category: string;
  confidence: number;
  isExact: boolean;
}

// Comprehensive brand database with categories and aliases
export const BRAND_DATABASE: Record<string, BrandInfo[]> = {
  toys: [
    { name: 'Lego', category: 'toys', aliases: ['legos', 'lego blocks', 'duplo'], ageGroups: ['toddler', 'child', 'teen'] },
    { name: 'Disney', category: 'toys', aliases: ['disney princess', 'mickey mouse', 'frozen'], ageGroups: ['toddler', 'child'] },
    { name: 'Fisher-Price', category: 'toys', aliases: ['fisher price', 'little people'], ageGroups: ['baby', 'toddler', 'child'] },
    { name: 'Mattel', category: 'toys', aliases: ['barbie', 'hot wheels', 'uno'], ageGroups: ['child', 'teen'] },
    { name: 'Hasbro', category: 'toys', aliases: ['transformers', 'my little pony', 'nerf'], ageGroups: ['child', 'teen'] },
    { name: 'Playmobil', category: 'toys', aliases: ['playmobile'], ageGroups: ['child', 'teen'] },
    { name: 'Melissa & Doug', category: 'toys', aliases: ['melissa and doug'], ageGroups: ['toddler', 'child'] }
  ],
  fashion: [
    { name: 'Nike', category: 'fashion', aliases: ['nike shoes', 'air jordan', 'swoosh'], ageGroups: ['child', 'teen', 'adult'] },
    { name: 'Adidas', category: 'fashion', aliases: ['adidas shoes', 'three stripes'], ageGroups: ['child', 'teen', 'adult'] },
    { name: 'Levi\'s', category: 'fashion', aliases: ['levis', 'levi strauss'], ageGroups: ['teen', 'adult'] },
    { name: 'Under Armour', category: 'fashion', aliases: ['underarmour', 'ua'], ageGroups: ['teen', 'adult'] },
    { name: 'Puma', category: 'fashion', aliases: ['puma shoes'], ageGroups: ['child', 'teen', 'adult'] },
    { name: 'Converse', category: 'fashion', aliases: ['chuck taylor', 'all star'], ageGroups: ['teen', 'adult'] }
  ],
  tech: [
    { name: 'Apple', category: 'tech', aliases: ['iphone', 'ipad', 'macbook', 'airpods'], ageGroups: ['teen', 'adult'] },
    { name: 'Samsung', category: 'tech', aliases: ['galaxy', 'samsung phone'], ageGroups: ['teen', 'adult'] },
    { name: 'Nintendo', category: 'tech', aliases: ['switch', 'nintendo switch', 'mario'], ageGroups: ['child', 'teen', 'adult'] },
    { name: 'Sony', category: 'tech', aliases: ['playstation', 'ps5', 'sony headphones'], ageGroups: ['teen', 'adult'] },
    { name: 'Microsoft', category: 'tech', aliases: ['xbox', 'surface'], ageGroups: ['teen', 'adult'] },
    { name: 'Google', category: 'tech', aliases: ['pixel', 'google home'], ageGroups: ['teen', 'adult'] }
  ],
  beauty: [
    { name: 'Sephora', category: 'beauty', aliases: ['sephora collection'], ageGroups: ['teen', 'adult'] },
    { name: 'MAC', category: 'beauty', aliases: ['mac cosmetics'], ageGroups: ['teen', 'adult'] },
    { name: 'Clinique', category: 'beauty', aliases: [], ageGroups: ['adult'] }
  ],
  books: [
    { name: 'Dr. Seuss', category: 'books', aliases: ['dr seuss', 'cat in the hat'], ageGroups: ['toddler', 'child'] },
    { name: 'Harry Potter', category: 'books', aliases: ['harry potter series', 'hogwarts'], ageGroups: ['child', 'teen', 'adult'] }
  ]
};

// Flatten all brands for easier searching
export const ALL_BRANDS = Object.values(BRAND_DATABASE).flat();

/**
 * Detect brands mentioned in a message
 */
export function detectBrandsInMessage(message: string): BrandMatch[] {
  const lowerMessage = message.toLowerCase();
  const matches: BrandMatch[] = [];
  
  for (const brand of ALL_BRANDS) {
    // Check exact brand name match
    if (lowerMessage.includes(brand.name.toLowerCase())) {
      matches.push({
        brand: brand.name,
        category: brand.category,
        confidence: 1.0,
        isExact: true
      });
      continue;
    }
    
    // Check aliases
    for (const alias of brand.aliases) {
      if (lowerMessage.includes(alias.toLowerCase())) {
        matches.push({
          brand: brand.name,
          category: brand.category,
          confidence: 0.9,
          isExact: false
        });
        break;
      }
    }
  }
  
  // Remove duplicates and sort by confidence
  const uniqueMatches = matches.filter((match, index, self) => 
    index === self.findIndex(m => m.brand === match.brand)
  );
  
  return uniqueMatches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get age-appropriate brands for a specific age group
 */
export function getAgeAppropriateBrands(ageGroup: string): string[] {
  return ALL_BRANDS
    .filter(brand => brand.ageGroups.includes(ageGroup))
    .map(brand => brand.name);
}

/**
 * Generate brand-first search query
 */
export function generateBrandFirstQuery(
  brands: string[], 
  interests: string[], 
  ageGroup?: string, 
  recipient?: string, 
  occasion?: string
): string {
  let query = "";
  
  // Start with brand if detected
  if (brands.length > 0) {
    query = brands[0]; // Use the most confident brand match
  }
  
  // Add interests
  if (interests.length > 0) {
    query += query ? ` ${interests.join(" ")}` : interests.join(" ");
  }
  
  // Add age-appropriate terms
  if (ageGroup) {
    query += ` for ${ageGroup}`;
  }
  
  // Add recipient if no age group
  if (recipient && !ageGroup) {
    query += ` for ${recipient}`;
  }
  
  // Add occasion
  if (occasion) {
    query += ` ${occasion}`;
  }
  
  return query.trim() || "gifts";
}

/**
 * Score products based on brand relevance
 */
export function calculateBrandRelevanceScore(
  productTitle: string,
  productBrand: string | undefined,
  detectedBrands: string[],
  interests: string[],
  ageGroup?: string
): number {
  let score = 0;
  
  if (!productTitle && !productBrand) return score;
  
  const title = (productTitle || "").toLowerCase();
  const brand = (productBrand || "").toLowerCase();
  
  // Brand exact match (highest priority)
  for (const detectedBrand of detectedBrands) {
    if (brand.includes(detectedBrand.toLowerCase())) {
      score += 50;
      break;
    }
    if (title.includes(detectedBrand.toLowerCase())) {
      score += 40;
      break;
    }
  }
  
  // Age appropriateness
  if (ageGroup) {
    const ageAppropriateBrands = getAgeAppropriateBrands(ageGroup);
    if (productBrand && ageAppropriateBrands.some(b => 
      brand.includes(b.toLowerCase()))) {
      score += 25;
    }
  }
  
  // Interest match
  for (const interest of interests) {
    if (title.includes(interest.toLowerCase()) || 
        brand.includes(interest.toLowerCase())) {
      score += 15;
      break;
    }
  }
  
  return score;
}
