
/**
 * Enhanced context parser for Nicole's AI conversations
 * Handles multi-interest detection and brand-category mapping
 */

export interface ParsedContext {
  recipient?: string;
  relationship?: string;
  occasion?: string;
  exactAge?: number;
  interests: string[];
  detectedBrands: string[];
  categoryMappings: CategoryMapping[];
  budget?: [number, number];
}

export interface CategoryMapping {
  interest: string;
  category: string;
  searchTerms: string[];
  priority: number;
}

// Enhanced brand detection with category associations
const BRAND_CATEGORIES = {
  // Athletic/Fashion brands
  'lululemon': { category: 'athletic-wear', terms: ['lululemon', 'yoga', 'athletic wear'] },
  'nike': { category: 'athletic-wear', terms: ['nike', 'sneakers', 'sportswear'] },
  'adidas': { category: 'athletic-wear', terms: ['adidas', 'shoes', 'sportswear'] },
  'patagonia': { category: 'outdoor-gear', terms: ['patagonia', 'outdoor', 'hiking'] },
  
  // Kitchen/Cooking brands
  'vitamix': { category: 'kitchen', terms: ['vitamix', 'blender', 'kitchen'] },
  'kitchenaid': { category: 'kitchen', terms: ['kitchenaid', 'mixer', 'kitchen'] },
  'all-clad': { category: 'kitchen', terms: ['all-clad', 'cookware', 'pans'] },
  'le creuset': { category: 'kitchen', terms: ['le creuset', 'cookware', 'dutch oven'] },
  'made in': { category: 'kitchen', terms: ['made in', 'cookware', 'professional'] },
  
  // Tech brands
  'apple': { category: 'electronics', terms: ['apple', 'iphone', 'ipad', 'airpods'] },
  'samsung': { category: 'electronics', terms: ['samsung', 'galaxy', 'electronics'] },
  'sony': { category: 'electronics', terms: ['sony', 'headphones', 'camera'] },
  
  // Travel brands
  'away': { category: 'travel', terms: ['away', 'luggage', 'suitcase'] },
  'tumi': { category: 'travel', terms: ['tumi', 'luggage', 'travel gear'] },
  'peak design': { category: 'travel', terms: ['peak design', 'camera bag', 'travel'] }
};

// Interest to category mapping
const INTEREST_CATEGORIES = {
  'cooking': { category: 'kitchen', terms: ['cooking', 'kitchen', 'cookware', 'chef'], priority: 1 },
  'baking': { category: 'kitchen', terms: ['baking', 'kitchen', 'bakeware', 'pastry'], priority: 1 },
  'travel': { category: 'travel', terms: ['travel', 'luggage', 'travel gear', 'accessories'], priority: 1 },
  'traveling': { category: 'travel', terms: ['travel', 'luggage', 'travel gear', 'accessories'], priority: 1 },
  'yoga': { category: 'fitness', terms: ['yoga', 'mat', 'meditation', 'wellness'], priority: 1 },
  'fitness': { category: 'fitness', terms: ['fitness', 'gym', 'workout', 'exercise'], priority: 1 },
  'running': { category: 'athletic-wear', terms: ['running', 'sneakers', 'athletic', 'marathon'], priority: 1 },
  'photography': { category: 'electronics', terms: ['camera', 'photography', 'lens', 'tripod'], priority: 1 },
  'reading': { category: 'books', terms: ['books', 'kindle', 'reading', 'literature'], priority: 1 },
  'gaming': { category: 'electronics', terms: ['gaming', 'console', 'video games', 'pc'], priority: 1 },
  'music': { category: 'electronics', terms: ['headphones', 'speakers', 'music', 'audio'], priority: 1 },
  'art': { category: 'art-supplies', terms: ['art supplies', 'painting', 'drawing', 'creative'], priority: 1 }
};

/**
 * Enhanced context parsing with multi-interest detection
 */
export const parseEnhancedContext = (message: string, currentContext: any = {}): ParsedContext => {
  const lowerMessage = message.toLowerCase();
  
  // Initialize parsed context
  const parsed: ParsedContext = {
    recipient: currentContext.recipient,
    relationship: currentContext.relationship,
    occasion: currentContext.occasion,
    exactAge: currentContext.exactAge,
    interests: currentContext.interests || [],
    detectedBrands: currentContext.detectedBrands || [],
    categoryMappings: [],
    budget: currentContext.budget
  };

  // Enhanced brand detection
  const detectedBrands = new Set(parsed.detectedBrands);
  for (const [brand, config] of Object.entries(BRAND_CATEGORIES)) {
    if (lowerMessage.includes(brand.toLowerCase())) {
      detectedBrands.add(brand);
      parsed.categoryMappings.push({
        interest: brand,
        category: config.category,
        searchTerms: config.terms,
        priority: 1
      });
    }
  }
  parsed.detectedBrands = Array.from(detectedBrands);

  // Enhanced interest detection
  const detectedInterests = new Set(parsed.interests);
  for (const [interest, config] of Object.entries(INTEREST_CATEGORIES)) {
    if (lowerMessage.includes(interest)) {
      detectedInterests.add(interest);
      parsed.categoryMappings.push({
        interest,
        category: config.category,
        searchTerms: config.terms,
        priority: config.priority
      });
    }
  }
  parsed.interests = Array.from(detectedInterests);

  // Enhanced relationship detection
  const relationshipPatterns = [
    { pattern: /\bmy (?:wife|husband|spouse|partner)\b/i, recipient: 'spouse', relationship: 'spouse' },
    { pattern: /\bmy (?:mom|mother|dad|father)\b/i, recipient: 'parent', relationship: 'parent' },
    { pattern: /\bmy (?:son|daughter|child|kid)\b/i, recipient: 'child', relationship: 'child' },
    { pattern: /\bmy (?:friend|buddy|pal)\b/i, recipient: 'friend', relationship: 'friend' },
    { pattern: /\bmy (?:brother|sister|sibling)\b/i, recipient: 'sibling', relationship: 'sibling' }
  ];

  for (const { pattern, recipient, relationship } of relationshipPatterns) {
    if (pattern.test(message) && !parsed.recipient) {
      parsed.recipient = recipient;
      parsed.relationship = relationship;
      break;
    }
  }

  // Enhanced occasion detection
  const occasionPatterns = [
    { pattern: /birthday|turning \d+|\d+th birthday/i, occasion: 'birthday' },
    { pattern: /christmas|holiday/i, occasion: 'christmas' },
    { pattern: /anniversary/i, occasion: 'anniversary' },
    { pattern: /valentine/i, occasion: 'valentine\'s day' },
    { pattern: /graduation/i, occasion: 'graduation' },
    { pattern: /wedding/i, occasion: 'wedding' }
  ];

  for (const { pattern, occasion } of occasionPatterns) {
    if (pattern.test(message) && !parsed.occasion) {
      parsed.occasion = occasion;
      break;
    }
  }

  // Enhanced budget extraction
  if (!parsed.budget) {
    const budgetPatterns = [
      { pattern: /(?:no more than|under|up to|maximum|max)\s*\$?(\d+)/i, type: 'max' },
      { pattern: /\$?(\d+)\s*(?:-|to)\s*\$?(\d+)/i, type: 'range' },
      { pattern: /(?:around|about|roughly)\s*\$?(\d+)/i, type: 'around' },
      { pattern: /(?:budget.*?\$?(\d+)|\$?(\d+).*?budget)/i, type: 'exact' }
    ];

    for (const { pattern, type } of budgetPatterns) {
      const match = message.match(pattern);
      if (match) {
        if (type === 'max') {
          const maxAmount = parseInt(match[1]);
          if (!isNaN(maxAmount) && maxAmount > 0) {
            const minAmount = Math.max(10, Math.floor(maxAmount * 0.5));
            parsed.budget = [minAmount, maxAmount];
            break;
          }
        } else if (type === 'range') {
          const min = parseInt(match[1]);
          const max = parseInt(match[2]);
          if (!isNaN(min) && !isNaN(max) && min > 0 && max > min) {
            parsed.budget = [min, max];
            break;
          }
        } else if (type === 'around') {
          const amount = parseInt(match[1]);
          if (!isNaN(amount) && amount > 0) {
            const min = Math.max(10, Math.floor(amount * 0.7));
            const max = Math.ceil(amount * 1.3);
            parsed.budget = [min, max];
            break;
          }
        } else if (type === 'exact') {
          const amount = parseInt(match[1] || match[2]);
          if (!isNaN(amount) && amount > 0) {
            const min = Math.max(10, Math.floor(amount * 0.8));
            const max = Math.ceil(amount * 1.2);
            parsed.budget = [min, max];
            break;
          }
        }
      }
    }
  }

  return parsed;
};

/**
 * Generate multiple targeted search queries based on parsed context
 */
export const generateMultiCategoryQueries = (parsedContext: ParsedContext): Array<{
  query: string;
  category: string;
  priority: number;
}> => {
  const queries: Array<{ query: string; category: string; priority: number }> = [];
  
  // Generate queries for each category mapping
  parsedContext.categoryMappings.forEach(mapping => {
    let query = mapping.searchTerms[0]; // Primary search term
    
    // Add recipient context if available
    if (parsedContext.recipient && !query.includes('for')) {
      query += ` for ${parsedContext.recipient}`;
    }
    
    // Add occasion if available
    if (parsedContext.occasion) {
      query += ` ${parsedContext.occasion}`;
    }
    
    // Add budget constraint
    if (parsedContext.budget) {
      const [, max] = parsedContext.budget;
      query += ` under $${max}`;
    }
    
    queries.push({
      query: query.trim(),
      category: mapping.category,
      priority: mapping.priority
    });
  });
  
  // Sort by priority and limit to top 4 categories
  return queries
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4);
};
