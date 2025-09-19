/**
 * Enhanced filter detection for modern e-commerce filtering
 */

import { extractSizesFromProducts, ComprehensiveSizes } from './enhancedSizeDetection';

export interface MaterialOption {
  value: string;
  label: string;
  count?: number;
}

export interface StyleOption {
  value: string;
  label: string;
  count?: number;
}

export interface FeatureOption {
  value: string;
  label: string;
  count?: number;
}

export interface EnhancedFilterDetection {
  sizes: ComprehensiveSizes;
  materials: MaterialOption[];
  styles: StyleOption[];
  features: FeatureOption[];
  seasons: StyleOption[];
  priceRanges: Array<{ min: number; max: number; label: string }>;
  brands: string[];
  colors: string[];
}

// Material detection patterns
const MATERIAL_PATTERNS = {
  cotton: /\bcotton\b/gi,
  denim: /\bdenim\b/gi,
  polyester: /\bpolyester\b/gi,
  leather: /\bleather\b/gi,
  wool: /\bwool\b/gi,
  silk: /\bsilk\b/gi,
  linen: /\blinen\b/gi,
  spandex: /\bspandex|elastane\b/gi,
  nylon: /\bnylon\b/gi,
  cashmere: /\bcashmere\b/gi,
  fleece: /\bfleece\b/gi,
  canvas: /\bcanvas\b/gi
};

// Style/occasion patterns
const STYLE_PATTERNS = {
  casual: /\bcasual|everyday|relaxed\b/gi,
  formal: /\bformal|dress|business|professional\b/gi,
  athletic: /\bathletic|sport|workout|gym|running|training\b/gi,
  work: /\bwork|workwear|uniform\b/gi,
  party: /\bparty|cocktail|evening|night\s*out\b/gi,
  outdoor: /\boutdoor|hiking|camping|adventure\b/gi,
  vintage: /\bvintage|retro|classic\b/gi,
  bohemian: /\bboho|bohemian|free\s*spirit\b/gi
};

// Feature patterns
const FEATURE_PATTERNS = {
  pockets: /\bpocket|pockets\b/gi,
  stretch: /\bstretch|elastic|flexible\b/gi,
  wrinkle_free: /\bwrinkle[\s-]?free|non[\s-]?wrinkle|easy[\s-]?care\b/gi,
  moisture_wicking: /\bmoisture[\s-]?wicking|quick[\s-]?dry|sweat[\s-]?wicking\b/gi,
  waterproof: /\bwater[\s-]?proof|water[\s-]?resistant\b/gi,
  breathable: /\bbreathable|ventilated\b/gi,
  machine_wash: /\bmachine[\s-]?wash|washable\b/gi,
  organic: /\borganic|eco[\s-]?friendly|sustainable\b/gi,
  hypoallergenic: /\bhypoallergenic|allergen[\s-]?free\b/gi,
  uv_protection: /\buv[\s-]?protection|sun[\s-]?protection|spf\b/gi
};

// Seasonal patterns
const SEASON_PATTERNS = {
  spring: /\bspring|light\s*weight\b/gi,
  summer: /\bsummer|hot\s*weather|tropical\b/gi,
  fall: /\bfall|autumn|mid[\s-]?weight\b/gi,
  winter: /\bwinter|cold\s*weather|thermal|insulated\b/gi,
  all_season: /\ball[\s-]?season|year[\s-]?round|transitional\b/gi
};

// Color patterns (basic colors)
const COLOR_PATTERNS = {
  black: /\bblack\b/gi,
  white: /\bwhite|cream|ivory|off[\s-]?white\b/gi,
  red: /\bred|crimson|burgundy|maroon\b/gi,
  blue: /\bblue|navy|royal|cobalt|turquoise\b/gi,
  green: /\bgreen|olive|emerald|forest\b/gi,
  yellow: /\byellow|gold|amber\b/gi,
  orange: /\borange|coral|peach\b/gi,
  purple: /\bpurple|violet|lavender|plum\b/gi,
  pink: /\bpink|rose|blush|magenta\b/gi,
  brown: /\bbrown|tan|beige|khaki|chocolate\b/gi,
  gray: /\bgray|grey|silver|charcoal\b/gi,
  multicolor: /\bmulti[\s-]?color|rainbow|tie[\s-]?dye|print\b/gi
};

// Price range definitions
const PRICE_RANGES = [
  { min: 0, max: 25, label: 'Under $25' },
  { min: 25, max: 50, label: '$25 - $50' },
  { min: 50, max: 100, label: '$50 - $100' },
  { min: 100, max: 200, label: '$100 - $200' },
  { min: 200, max: 500, label: '$200 - $500' },
  { min: 500, max: Infinity, label: '$500+' }
];

/**
 * Extracts enhanced filter options from product array
 */
export function extractEnhancedFilters(products: any[]): EnhancedFilterDetection {
  const materialCounts = new Map<string, number>();
  const styleCounts = new Map<string, number>();
  const featureCounts = new Map<string, number>();
  const seasonCounts = new Map<string, number>();
  const brandSet = new Set<string>();
  const colorCounts = new Map<string, number>();

  // Extract sizes using enhanced size detection
  const sizes = extractSizesFromProducts(products);

  products.forEach(product => {
    const text = `${product.title || product.name || ''} ${product.description || ''}`.toLowerCase();
    
    // Extract materials
    Object.entries(MATERIAL_PATTERNS).forEach(([material, pattern]) => {
      if (pattern.test(text)) {
        materialCounts.set(material, (materialCounts.get(material) || 0) + 1);
      }
    });

    // Extract styles
    Object.entries(STYLE_PATTERNS).forEach(([style, pattern]) => {
      if (pattern.test(text)) {
        styleCounts.set(style, (styleCounts.get(style) || 0) + 1);
      }
    });

    // Extract features
    Object.entries(FEATURE_PATTERNS).forEach(([feature, pattern]) => {
      if (pattern.test(text)) {
        featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
      }
    });

    // Extract seasons
    Object.entries(SEASON_PATTERNS).forEach(([season, pattern]) => {
      if (pattern.test(text)) {
        seasonCounts.set(season, (seasonCounts.get(season) || 0) + 1);
      }
    });

    // Extract brands
    if (product.brand) {
      brandSet.add(product.brand);
    }

    // Extract colors
    Object.entries(COLOR_PATTERNS).forEach(([color, pattern]) => {
      if (pattern.test(text)) {
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      }
    });
  });

  // Convert to sorted arrays with counts
  const materials = Array.from(materialCounts.entries())
    .map(([value, count]) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' '),
      count
    }))
    .sort((a, b) => b.count - a.count);

  const styles = Array.from(styleCounts.entries())
    .map(([value, count]) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' '),
      count
    }))
    .sort((a, b) => b.count - a.count);

  const features = Array.from(featureCounts.entries())
    .map(([value, count]) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' '),
      count
    }))
    .sort((a, b) => b.count - a.count);

  const seasons = Array.from(seasonCounts.entries())
    .map(([value, count]) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' '),
      count
    }))
    .sort((a, b) => b.count - a.count);

  const colors = Array.from(colorCounts.keys()).sort();
  const brands = Array.from(brandSet).sort();

  return {
    sizes,
    materials,
    styles,
    features,
    seasons,
    priceRanges: PRICE_RANGES,
    brands,
    colors
  };
}

/**
 * Checks if a product matches enhanced filter criteria
 */
export function matchesEnhancedFilters(product: any, filters: {
  materials?: string[];
  styles?: string[];
  features?: string[];
  seasons?: string[];
  colors?: string[];
}): boolean {
  const text = `${product.title || product.name || ''} ${product.description || ''}`.toLowerCase();

  // Check materials
  if (filters.materials && filters.materials.length > 0) {
    const hasMatch = filters.materials.some(material => 
      MATERIAL_PATTERNS[material as keyof typeof MATERIAL_PATTERNS]?.test(text)
    );
    if (!hasMatch) return false;
  }

  // Check styles
  if (filters.styles && filters.styles.length > 0) {
    const hasMatch = filters.styles.some(style => 
      STYLE_PATTERNS[style as keyof typeof STYLE_PATTERNS]?.test(text)
    );
    if (!hasMatch) return false;
  }

  // Check features
  if (filters.features && filters.features.length > 0) {
    const hasMatch = filters.features.some(feature => 
      FEATURE_PATTERNS[feature as keyof typeof FEATURE_PATTERNS]?.test(text)
    );
    if (!hasMatch) return false;
  }

  // Check seasons
  if (filters.seasons && filters.seasons.length > 0) {
    const hasMatch = filters.seasons.some(season => 
      SEASON_PATTERNS[season as keyof typeof SEASON_PATTERNS]?.test(text)
    );
    if (!hasMatch) return false;
  }

  // Check colors
  if (filters.colors && filters.colors.length > 0) {
    const hasMatch = filters.colors.some(color => 
      COLOR_PATTERNS[color as keyof typeof COLOR_PATTERNS]?.test(text)
    );
    if (!hasMatch) return false;
  }

  return true;
}