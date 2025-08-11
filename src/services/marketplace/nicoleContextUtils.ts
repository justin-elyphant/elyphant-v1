import { UnifiedNicoleContext } from "@/services/ai/unified/types";

export interface PriceRangeOptions {
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Extract budget/price range from Nicole AI context with enhanced detection
 */
export const extractBudgetFromNicoleContext = (context?: UnifiedNicoleContext): PriceRangeOptions => {
  if (!context) return {};
  
  console.log(`[Nicole Budget Debug] Processing context:`, context);
  
  // Check for budget - in UnifiedNicoleContext it's [number, number] array
  const budget = context.budget;
  
  if (budget) {
    console.log(`[Nicole Budget Debug] Found context.budget:`, budget);
    // Handle budget array [min, max]
    if (Array.isArray(budget) && budget.length === 2) {
      const result = {
        minPrice: typeof budget[0] === 'number' ? budget[0] : undefined,
        maxPrice: typeof budget[1] === 'number' ? budget[1] : undefined
      };
      console.log(`[Nicole Budget Debug] Extracted from budget array:`, result);
      return result;
    }
  }
  
  // Check autoGiftIntelligence for budget range
  if (context.autoGiftIntelligence?.primaryRecommendation?.budgetRange) {
    const range = context.autoGiftIntelligence.primaryRecommendation.budgetRange;
    console.log(`[Nicole Budget Debug] Found autoGiftIntelligence budget:`, range);
    if (Array.isArray(range) && range.length === 2) {
      const result = {
        minPrice: range[0],
        maxPrice: range[1]
      };
      console.log(`[Nicole Budget Debug] Extracted from autoGiftIntelligence:`, result);
      return result;
    }
  }
  
  // Check for URL-based price parameters (from Nicole navigation)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const minPrice = urlParams.get('minPrice');
    const maxPrice = urlParams.get('maxPrice');
    
    if (minPrice || maxPrice) {
      const result = {
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
      };
      console.log(`[Nicole Budget Debug] Extracted from URL params:`, result);
      return result;
    }
  }
  
  // Check for age-based budget hints using exactAge
  if (context.exactAge) {
    const age = context.exactAge;
    console.log(`[Nicole Budget Debug] Using age-based budget for age:`, age);
    // Set reasonable defaults based on age
    if (age < 13) {
      return { minPrice: 10, maxPrice: 50 };
    }
    if (age < 18) {
      return { minPrice: 20, maxPrice: 100 };
    }
    if (age < 25) {
      return { minPrice: 30, maxPrice: 150 };
    }
  }
  
  console.log(`[Nicole Budget Debug] No budget found, returning empty`);
  return {};
};

/**
 * Format price range for display purposes
 */
export const formatPriceRange = (options: PriceRangeOptions): string => {
  if (!options.minPrice && !options.maxPrice) {
    return 'Any price';
  }
  
  if (options.minPrice && options.maxPrice) {
    return `$${options.minPrice} - $${options.maxPrice}`;
  }
  
  if (options.maxPrice) {
    return `Under $${options.maxPrice}`;
  }
  
  if (options.minPrice) {
    return `$${options.minPrice}+`;
  }
  
  return 'Any price';
};

/**
 * Validate that search results match the expected price range
 */
export const validateResultsPriceRange = (
  products: any[], 
  priceRange: PriceRangeOptions
): { validProducts: any[]; invalidProducts: any[] } => {
  const validProducts: any[] = [];
  const invalidProducts: any[] = [];
  
  for (const product of products) {
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0');
    
    let isValid = true;
    
    if (priceRange.minPrice && price < priceRange.minPrice) {
      isValid = false;
    }
    
    if (priceRange.maxPrice && price > priceRange.maxPrice) {
      isValid = false;
    }
    
    if (isValid) {
      validProducts.push(product);
    } else {
      invalidProducts.push(product);
    }
  }
  
  return { validProducts, invalidProducts };
};

/**
 * Log price range debugging info
 */
export const logPriceRangeDebug = (
  searchTerm: string, 
  context: UnifiedNicoleContext | undefined, 
  extractedRange: PriceRangeOptions
): void => {
  console.log(`[Nicole Budget Debug] Search: "${searchTerm}"`);
  console.log(`[Nicole Budget Debug] Context budget:`, context?.budget);
  console.log(`[Nicole Budget Debug] Extracted range:`, extractedRange);
  console.log(`[Nicole Budget Debug] Formatted range:`, formatPriceRange(extractedRange));
};