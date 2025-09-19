/**
 * Advanced Size Detection - Phase 2: Enhanced Pattern Recognition
 * Sophisticated size detection with international conversions and brand-specific patterns
 */

import { SizeDetectionResult, ComprehensiveSizes } from "@/components/marketplace/utils/enhancedSizeDetection";

// International size conversion maps
export const SIZE_CONVERSIONS = {
  // EU to US Women's Shoes
  womenShoes: {
    '35': '5', '35.5': '5.5', '36': '6', '37': '6.5', '37.5': '7',
    '38': '7.5', '38.5': '8', '39': '8.5', '40': '9', '41': '9.5',
    '42': '10', '42.5': '10.5', '43': '11'
  },
  // EU to US Men's Shoes  
  menShoes: {
    '39': '6', '40': '7', '41': '8', '42': '9', '43': '10',
    '44': '11', '45': '12', '46': '13', '47': '14'
  },
  // UK to US Women's Shoes
  ukWomenShoes: {
    '2.5': '5', '3': '5.5', '3.5': '6', '4': '6.5', '4.5': '7',
    '5': '7.5', '5.5': '8', '6': '8.5', '6.5': '9', '7': '9.5'
  },
  // EU to US Clothing (Women)
  womenClothing: {
    '32': 'XXS', '34': 'XS', '36': 'S', '38': 'M', '40': 'L',
    '42': 'XL', '44': 'XXL'
  },
  // EU to US Clothing (Men)
  menClothing: {
    '44': 'XS', '46': 'S', '48': 'M', '50': 'L', '52': 'XL',
    '54': 'XXL', '56': '3XL'
  }
};

// Brand-specific size patterns and formatting
export const BRAND_SIZE_PATTERNS = {
  'nike': {
    shoes: /nike\s+(?:size\s+)?(\d{1,2}(?:\.\d)?)\s*(?:us|men|women)?/gi,
    clothing: /nike\s+(?:size\s+)?(xs|s|m|l|xl|xxl|\dx)/gi
  },
  'adidas': {
    shoes: /adidas\s+(?:size\s+)?(\d{1,2}(?:\.\d)?)\s*(?:us|uk|eu)?/gi,
    clothing: /adidas\s+(?:size\s+)?(xs|s|m|l|xl|xxl)/gi
  },
  'levis': {
    waist: /(?:levi'?s?\s+)?(\d{2})\s*(?:w|waist)/gi,
    inseam: /(?:levi'?s?\s+)?(\d{2})\s*(?:l|length|inseam)/gi,
    combined: /(?:levi'?s?\s+)?(\d{2})\s*[wx]\s*(\d{2})/gi
  },
  'gap': {
    sizes: /gap\s+(?:size\s+)?(xs|s|m|l|xl|xxl|\d{2})/gi
  },
  'old_navy': {
    sizes: /old\s+navy\s+(?:size\s+)?(xs|s|m|l|xl|xxl|\d{2})/gi
  }
};

// Enhanced regex patterns for various size formats
const ADVANCED_SIZE_PATTERNS = {
  // International shoe size patterns
  euShoes: /\b(?:eu|eur|european)\s*(?:size\s*)?(\d{2}(?:\.\d)?)\b/gi,
  ukShoes: /\b(?:uk|british)\s*(?:size\s*)?(\d{1,2}(?:\.\d)?)\b/gi,
  
  // Numeric clothing sizes (European style)
  numericClothing: /\b(?:size\s*)?(\d{2})\s*(?:eu|eur|european)?\b/gi,
  
  // Size ranges in titles
  sizeRange: /sizes?\s*(\d{1,2}(?:\.\d)?)\s*[-–—]\s*(\d{1,2}(?:\.\d)?)/gi,
  multiSizes: /(?:sizes?\s*available:?\s*)?([xs|s|m|l|xl|\d]+(?:\s*[,\/]\s*[xs|s|m|l|xl|\d]+)*)/gi,
  
  // Plus size variations
  plusVariations: /\b(\d+)x\b|\bplus\s*size\s*(\d+x?)\b|(\dx)\s*plus/gi,
  
  // Petite and tall variations
  petiteVariations: /\b(xs|s|m|l|xl|xxl)\s*(?:petite|p)\b/gi,
  tallVariations: /\b(xs|s|m|l|xl|xxl)\s*(?:tall|t)\b/gi,
  
  // Advanced waist/inseam patterns
  detailedWaistInseam: /\b(\d{2})\s*(?:inch\s*)?(?:waist|w)\s*[x×]\s*(\d{2})\s*(?:inch\s*)?(?:inseam|length|l)\b/gi,
  waistOnly: /\b(\d{2})\s*(?:inch\s*)?\s*waist(?:\s*size)?\b/gi,
  inseamOnly: /\b(\d{2})\s*(?:inch\s*)?\s*(?:inseam|length)(?:\s*size)?\b/gi,
  
  // Size charts and measurements
  sizeChart: /size\s*chart:?\s*([^.]+)/gi,
  measurements: /measurements?:?\s*([^.]+)/gi
};

/**
 * Detects sizes using advanced patterns and international conversions
 */
export function detectAdvancedSizes(text: string): SizeDetectionResult {
  const cleanText = text.toLowerCase().replace(/[^\w\s\.\/x×-]/g, ' ');
  
  const result: SizeDetectionResult = {
    waistSizes: [],
    inseamLengths: [],
    shoeSizes: [],
    clothingSizes: [],
    numeric: false,
    hasPlus: false
  };

  // Detect international shoe sizes and convert
  detectInternationalShoes(cleanText, result);
  
  // Detect size ranges
  detectSizeRanges(cleanText, result);
  
  // Detect brand-specific patterns
  detectBrandSpecificSizes(cleanText, result);
  
  // Detect plus size variations
  detectPlusSizeVariations(cleanText, result);
  
  // Detect petite/tall variations
  detectVariationSizes(cleanText, result);
  
  // Enhanced waist/inseam detection
  detectAdvancedWaistInseam(cleanText, result);

  return result;
}

/**
 * Detects international shoe sizes and converts to US
 */
function detectInternationalShoes(text: string, result: SizeDetectionResult): void {
  // EU shoe sizes
  const euMatches = [...text.matchAll(ADVANCED_SIZE_PATTERNS.euShoes)];
  euMatches.forEach(match => {
    const euSize = match[1];
    const usWomenSize = SIZE_CONVERSIONS.womenShoes[euSize as keyof typeof SIZE_CONVERSIONS.womenShoes];
    const usMenSize = SIZE_CONVERSIONS.menShoes[euSize as keyof typeof SIZE_CONVERSIONS.menShoes];
    
    if (usWomenSize && !result.shoeSizes.includes(usWomenSize)) {
      result.shoeSizes.push(usWomenSize);
      result.numeric = true;
    }
    if (usMenSize && !result.shoeSizes.includes(usMenSize)) {
      result.shoeSizes.push(usMenSize);
      result.numeric = true;
    }
  });

  // UK shoe sizes
  const ukMatches = [...text.matchAll(ADVANCED_SIZE_PATTERNS.ukShoes)];
  ukMatches.forEach(match => {
    const ukSize = match[1];
    const usSize = SIZE_CONVERSIONS.ukWomenShoes[ukSize as keyof typeof SIZE_CONVERSIONS.ukWomenShoes];
    if (usSize && !result.shoeSizes.includes(usSize)) {
      result.shoeSizes.push(usSize);
      result.numeric = true;
    }
  });
}

/**
 * Detects size ranges in product descriptions
 */
function detectSizeRanges(text: string, result: SizeDetectionResult): void {
  const rangeMatches = [...text.matchAll(ADVANCED_SIZE_PATTERNS.sizeRange)];
  rangeMatches.forEach(match => {
    const startSize = parseFloat(match[1]);
    const endSize = parseFloat(match[2]);
    
    // Generate range for shoes
    if (startSize >= 5 && endSize <= 15) {
      for (let size = startSize; size <= endSize; size += 0.5) {
        const sizeStr = size % 1 === 0 ? size.toString() : size.toString();
        if (!result.shoeSizes.includes(sizeStr)) {
          result.shoeSizes.push(sizeStr);
        }
      }
      result.numeric = true;
    }
  });
}

/**
 * Detects brand-specific size patterns
 */
function detectBrandSpecificSizes(text: string, result: SizeDetectionResult): void {
  Object.entries(BRAND_SIZE_PATTERNS).forEach(([brand, patterns]) => {
    if (text.includes(brand.replace('_', ' '))) {
      if ('shoes' in patterns) {
        const matches = [...text.matchAll(patterns.shoes)];
        matches.forEach(match => {
          const size = match[1];
          if (!result.shoeSizes.includes(size)) {
            result.shoeSizes.push(size);
            result.numeric = true;
          }
        });
      }
      
      if ('waist' in patterns) {
        const matches = [...text.matchAll(patterns.waist)];
        matches.forEach(match => {
          const size = match[1];
          if (!result.waistSizes.includes(size)) {
            result.waistSizes.push(size);
            result.numeric = true;
          }
        });
      }
      
      if ('combined' in patterns) {
        const matches = [...text.matchAll(patterns.combined)];
        matches.forEach(match => {
          const waist = match[1];
          const inseam = match[2];
          if (!result.waistSizes.includes(waist)) {
            result.waistSizes.push(waist);
          }
          if (!result.inseamLengths.includes(inseam)) {
            result.inseamLengths.push(inseam);
          }
          result.numeric = true;
        });
      }
    }
  });
}

/**
 * Detects plus size variations
 */
function detectPlusSizeVariations(text: string, result: SizeDetectionResult): void {
  const plusMatches = [...text.matchAll(ADVANCED_SIZE_PATTERNS.plusVariations)];
  plusMatches.forEach(match => {
    const size = (match[1] || match[2] || match[3]).toUpperCase();
    if (!result.clothingSizes.includes(size)) {
      result.clothingSizes.push(size);
      result.hasPlus = true;
    }
  });
}

/**
 * Detects petite and tall size variations
 */
function detectVariationSizes(text: string, result: SizeDetectionResult): void {
  // Petite sizes
  const petiteMatches = [...text.matchAll(ADVANCED_SIZE_PATTERNS.petiteVariations)];
  petiteMatches.forEach(match => {
    const size = `${match[1].toUpperCase()}P`;
    if (!result.clothingSizes.includes(size)) {
      result.clothingSizes.push(size);
    }
  });

  // Tall sizes  
  const tallMatches = [...text.matchAll(ADVANCED_SIZE_PATTERNS.tallVariations)];
  tallMatches.forEach(match => {
    const size = `${match[1].toUpperCase()}T`;
    if (!result.clothingSizes.includes(size)) {
      result.clothingSizes.push(size);
    }
  });
}

/**
 * Enhanced waist and inseam detection
 */
function detectAdvancedWaistInseam(text: string, result: SizeDetectionResult): void {
  // Detailed waist x inseam
  const detailedMatches = [...text.matchAll(ADVANCED_SIZE_PATTERNS.detailedWaistInseam)];
  detailedMatches.forEach(match => {
    const waist = match[1];
    const inseam = match[2];
    if (!result.waistSizes.includes(waist)) {
      result.waistSizes.push(waist);
    }
    if (!result.inseamLengths.includes(inseam)) {
      result.inseamLengths.push(inseam);
    }
    result.numeric = true;
  });

  // Waist only
  const waistMatches = [...text.matchAll(ADVANCED_SIZE_PATTERNS.waistOnly)];
  waistMatches.forEach(match => {
    const waist = match[1];
    if (!result.waistSizes.includes(waist)) {
      result.waistSizes.push(waist);
      result.numeric = true;
    }
  });

  // Inseam only
  const inseamMatches = [...text.matchAll(ADVANCED_SIZE_PATTERNS.inseamOnly)];
  inseamMatches.forEach(match => {
    const inseam = match[1];
    if (!result.inseamLengths.includes(inseam)) {
      result.inseamLengths.push(inseam);
    }
  });
}

/**
 * Smart size prediction based on category and brand
 */
export function predictMissingSizes(
  detectedSizes: SizeDetectionResult, 
  category: string, 
  brand?: string
): ComprehensiveSizes {
  const result: ComprehensiveSizes = {
    waist: [...detectedSizes.waistSizes],
    inseam: [...detectedSizes.inseamLengths],
    shoes: [...detectedSizes.shoeSizes],
    clothing: [...detectedSizes.clothingSizes]
  };

  // If jeans/pants but no sizes detected, predict common sizes
  if (category === 'clothing' && 
      (detectedSizes.waistSizes.length === 0 && detectedSizes.clothingSizes.length === 0)) {
    
    // Predict based on brand
    if (brand?.toLowerCase().includes('levi')) {
      result.waist = ['30', '32', '34', '36'];
      result.inseam = ['30', '32', '34'];
    } else {
      result.clothing = ['S', 'M', 'L', 'XL'];
    }
  }

  return result;
}

/**
 * Enhanced size extraction that combines all detection methods
 */
export function extractAdvancedSizes(products: any[]): ComprehensiveSizes {
  const allSizes: ComprehensiveSizes = {
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
    const detected = detectAdvancedSizes(text);
    
    // Use smart prediction if basic detection fails
    const predicted = predictMissingSizes(detected, product.category, product.brand);
    
    detected.waistSizes.forEach(size => waistSet.add(size));
    detected.inseamLengths.forEach(size => inseamSet.add(size));
    detected.shoeSizes.forEach(size => shoeSet.add(size));
    detected.clothingSizes.forEach(size => clothingSet.add(size));
    
    // Add predicted sizes if no direct detection
    if (detected.waistSizes.length === 0) {
      predicted.waist.forEach(size => waistSet.add(size));
    }
    if (detected.clothingSizes.length === 0) {
      predicted.clothing.forEach(size => clothingSet.add(size));
    }
  });

  // Sort and return
  allSizes.waist = Array.from(waistSet).sort((a, b) => parseInt(a) - parseInt(b));
  allSizes.inseam = Array.from(inseamSet).sort((a, b) => parseInt(a) - parseInt(b));
  allSizes.shoes = Array.from(shoeSet).sort((a, b) => parseFloat(a) - parseFloat(b));
  
  const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '1X', '2X', '3X', '4X', '5X'];
  allSizes.clothing = Array.from(clothingSet).sort((a, b) => {
    return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
  });

  return allSizes;
}