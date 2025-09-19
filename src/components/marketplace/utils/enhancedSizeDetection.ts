/**
 * Enhanced size detection utilities for comprehensive e-commerce filtering
 */

export interface SizeDetectionResult {
  waistSizes: string[];
  inseamLengths: string[];
  shoeSizes: string[];
  clothingSizes: string[];
  numeric: boolean;
  hasPlus: boolean;
}

export interface ComprehensiveSizes {
  waist: string[];
  inseam: string[];
  shoes: string[];
  clothing: string[];
}

// Comprehensive size arrays
export const WAIST_SIZES = [
  '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', 
  '38', '40', '42', '44', '46', '48', '50', '52'
];

export const INSEAM_LENGTHS = [
  '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38'
];

export const SHOE_SIZES_MEN = [
  '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', 
  '11', '11.5', '12', '12.5', '13', '13.5', '14', '15'
];

export const SHOE_SIZES_WOMEN = [
  '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', 
  '10', '10.5', '11', '11.5', '12'
];

export const CLOTHING_SIZES = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'
];

export const PLUS_SIZES = [
  '1X', '2X', '3X', '4X', '5X', '6X'
];

// Enhanced regex patterns for size detection
const SIZE_PATTERNS = {
  // Waist x Inseam patterns: "32x34", "32W x 34L", "32w/34l", "size 32/34"
  waistInseam: /\b(\d{2})\s*[wx\/]\s*(\d{2})[lL]?\b/gi,
  
  // Standalone waist: "32 waist", "32W", "32 inch waist", "waist 32"
  waist: /(?:waist\s*(\d{2})|(\d{2})\s*(?:inch\s*)?(?:waist|w)\b)/gi,
  
  // Standalone inseam: "34L", "34 length", "inseam 34"
  inseam: /(?:inseam\s*(\d{2})|(\d{2})\s*(?:inch\s*)?(?:length|inseam|l)\b)/gi,
  
  // Shoe sizes: "size 10", "10.5", "men's 11", "women's 8.5"
  shoes: /(?:size\s*)?(?:men'?s\s*|women'?s\s*)?(\d{1,2}(?:\.\d)?)\s*(?:us|uk|eu)?\b/gi,
  
  // Letter sizes with plus variations
  clothing: /\b((?:\d+)?x{1,2}[sl]|[sl]|[ml]|plus|petite|\d+x)\b/gi,
  
  // Plus size indicators
  plus: /\b(?:plus\s*size|curvy|extended\s*size|\dx\b)/gi
};

/**
 * Detects all size types from product text
 */
export function detectSizesFromText(text: string): SizeDetectionResult {
  const cleanText = text.toLowerCase().replace(/[^\w\s\.\/x-]/g, ' ');
  
  const result: SizeDetectionResult = {
    waistSizes: [],
    inseamLengths: [],
    shoeSizes: [],
    clothingSizes: [],
    numeric: false,
    hasPlus: false
  };

  // Detect waist x inseam combinations first (most specific)
  const waistInseamMatches = [...cleanText.matchAll(SIZE_PATTERNS.waistInseam)];
  waistInseamMatches.forEach(match => {
    const waist = match[1];
    const inseam = match[2];
    if (WAIST_SIZES.includes(waist)) {
      result.waistSizes.push(waist);
      result.numeric = true;
    }
    if (INSEAM_LENGTHS.includes(inseam)) {
      result.inseamLengths.push(inseam);
    }
  });

  // Detect standalone waist sizes
  const waistMatches = [...cleanText.matchAll(SIZE_PATTERNS.waist)];
  waistMatches.forEach(match => {
    const waist = match[1] || match[2];
    if (waist && WAIST_SIZES.includes(waist) && !result.waistSizes.includes(waist)) {
      result.waistSizes.push(waist);
      result.numeric = true;
    }
  });

  // Detect standalone inseam lengths
  const inseamMatches = [...cleanText.matchAll(SIZE_PATTERNS.inseam)];
  inseamMatches.forEach(match => {
    const inseam = match[1] || match[2];
    if (inseam && INSEAM_LENGTHS.includes(inseam) && !result.inseamLengths.includes(inseam)) {
      result.inseamLengths.push(inseam);
    }
  });

  // Detect shoe sizes (more conservative to avoid false positives)
  if (text.includes('shoe') || text.includes('boot') || text.includes('sneaker') || 
      text.includes('sandal') || text.includes('heel')) {
    const shoeMatches = [...cleanText.matchAll(SIZE_PATTERNS.shoes)];
    shoeMatches.forEach(match => {
      const size = match[1];
      if (size && (SHOE_SIZES_MEN.includes(size) || SHOE_SIZES_WOMEN.includes(size))) {
        result.shoeSizes.push(size);
        result.numeric = true;
      }
    });
  }

  // Detect clothing sizes
  const clothingMatches = [...cleanText.matchAll(SIZE_PATTERNS.clothing)];
  clothingMatches.forEach(match => {
    const size = match[1].toUpperCase();
    if (CLOTHING_SIZES.includes(size) || PLUS_SIZES.includes(size)) {
      result.clothingSizes.push(size);
      if (PLUS_SIZES.includes(size)) {
        result.hasPlus = true;
      }
    }
  });

  // Check for plus size indicators
  if (SIZE_PATTERNS.plus.test(cleanText)) {
    result.hasPlus = true;
  }

  return result;
}

/**
 * Extracts sizes from product array and categorizes them
 */
export function extractSizesFromProducts(products: any[]): ComprehensiveSizes {
  console.log(`🎯 Size extraction starting with ${products.length} products`);
  
  const sizes: ComprehensiveSizes = {
    waist: [],
    inseam: [],
    shoes: [],
    clothing: []
  };

  const waistSet = new Set<string>();
  const inseamSet = new Set<string>();
  const shoeSet = new Set<string>();
  const clothingSet = new Set<string>();

  products.forEach(product => {
    const text = `${product.title || product.name || ''} ${product.description || ''}`;
    console.log(`🎯 Size detection for product: "${product.title}" with text: "${text.substring(0, 50)}..."`);
    
    const detected = detectSizesFromText(text);
    console.log(`🎯 Detected sizes for "${product.title}":`, detected);

    detected.waistSizes.forEach(size => waistSet.add(size));
    detected.inseamLengths.forEach(size => inseamSet.add(size));
    detected.shoeSizes.forEach(size => shoeSet.add(size));
    detected.clothingSizes.forEach(size => clothingSet.add(size));
  });
  
  // Sort numerically for waist and inseam
  sizes.waist = Array.from(waistSet).sort((a, b) => parseInt(a) - parseInt(b));
  sizes.inseam = Array.from(inseamSet).sort((a, b) => parseInt(a) - parseInt(b));
  sizes.shoes = Array.from(shoeSet).sort((a, b) => {
    const aNum = parseFloat(a);
    const bNum = parseFloat(b);
    return aNum - bNum;
  });
  
  // Sort clothing sizes by predefined order
  const sizeOrder = [...CLOTHING_SIZES, ...PLUS_SIZES];
  sizes.clothing = Array.from(clothingSet).sort((a, b) => {
    return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
  });

  console.log(`🎯 Final extracted sizes:`, {
    waist: sizes.waist,
    inseam: sizes.inseam, 
    shoes: sizes.shoes,
    clothing: sizes.clothing
  });

  return sizes;
}

/**
 * Determines if a product matches size filters
 */
export function matchesSizeFilters(product: any, filters: {
  waist?: string[];
  inseam?: string[];
  shoes?: string[];
  clothing?: string[];
}): boolean {
  const text = `${product.title || product.name || ''} ${product.description || ''}`;
  const detected = detectSizesFromText(text);

  // Check waist sizes
  if (filters.waist && filters.waist.length > 0) {
    const hasWaistMatch = filters.waist.some(size => detected.waistSizes.includes(size));
    if (!hasWaistMatch) return false;
  }

  // Check inseam lengths
  if (filters.inseam && filters.inseam.length > 0) {
    const hasInseamMatch = filters.inseam.some(size => detected.inseamLengths.includes(size));
    if (!hasInseamMatch) return false;
  }

  // Check shoe sizes
  if (filters.shoes && filters.shoes.length > 0) {
    const hasShoeMatch = filters.shoes.some(size => detected.shoeSizes.includes(size));
    if (!hasShoeMatch) return false;
  }

  // Check clothing sizes
  if (filters.clothing && filters.clothing.length > 0) {
    const hasClothingMatch = filters.clothing.some(size => detected.clothingSizes.includes(size));
    if (!hasClothingMatch) return false;
  }

  return true;
}