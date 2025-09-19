/**
 * Smart filter detection based on search context and product data
 */

import { extractEnhancedFilters, matchesEnhancedFilters } from './enhancedFilterDetection';
import { extractSizesFromProducts, matchesSizeFilters, ComprehensiveSizes, WAIST_SIZES, INSEAM_LENGTHS, CLOTHING_SIZES } from './enhancedSizeDetection';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterConfig {
  type: 'range' | 'radio' | 'checkbox' | 'size_range';
  label: string;
  min?: number;
  max?: number;
  options?: FilterOption[];
  sizeType?: 'waist' | 'inseam' | 'shoes' | 'clothing';
}

export interface SmartFilterContext {
  searchTerm: string;
  detectedCategory: string | null;
  suggestedFilters: Record<string, FilterConfig>;
  productAttributes: Record<string, Set<string>>;
  enhancedFilters?: any;
}

/**
 * Detect product category from search term
 */
export const detectCategoryFromSearch = (searchTerm: string): string | null => {
  const normalizedTerm = searchTerm.toLowerCase();
  
  // Clothing/Fashion keywords
  if (normalizedTerm.match(/\b(jeans|denim|pants|shirt|jacket|dress|shoes|sneakers|boots|clothing|apparel|fashion|nike|adidas|levis?|gap|zara|h&m)\b/)) {
    return 'clothing';
  }
  
  // Electronics keywords
  if (normalizedTerm.match(/\b(phone|laptop|computer|tablet|headphones|speaker|camera|tv|electronics|apple|samsung|sony|microsoft)\b/)) {
    return 'electronics';
  }
  
  // Home & Kitchen keywords
  if (normalizedTerm.match(/\b(kitchen|home|furniture|decor|appliance|cookware|bedding|bathroom|ikea|cuisinart|dyson)\b/)) {
    return 'home';
  }
  
  // Sports keywords
  if (normalizedTerm.match(/\b(sports?|fitness|gym|basketball|football|soccer|tennis|golf|nike|adidas|under\s?armour|wilson)\b/)) {
    return 'sports';
  }
  
  return null;
};

/**
 * Extract product attributes from search results for dynamic filters
 */
export const extractProductAttributes = (products: any[]): Record<string, Set<string>> => {
  const attributes: Record<string, Set<string>> = {
    brands: new Set(),
    colors: new Set(),
    sizes: new Set(),
    categories: new Set(),
    genders: new Set(),
  };
  
  products.forEach(product => {
    // Extract brand
    if (product.brand) {
      attributes.brands.add(product.brand);
    }
    
    // Extract category
    if (product.category) {
      attributes.categories.add(product.category);
    }
    
    // Extract attributes from title and description
    const text = `${product.title || ''} ${product.description || ''}`.toLowerCase();
    
    // Debug logging for gender detection
    console.log(`🔍 Gender Detection Debug - Product: "${product.title}"`, {
      text: text.substring(0, 100),
      productData: {
        title: product.title,
        description: product.description?.substring(0, 100),
        category: product.category,
        brand: product.brand
      }
    });
    
    // Color detection
    const colors = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'grey', 'navy', 'dark', 'light'];
    colors.forEach(color => {
      if (text.includes(color)) {
        attributes.colors.add(color.charAt(0).toUpperCase() + color.slice(1));
      }
    });
    
    // Enhanced size detection using new utilities
    const sizeDetection = extractSizesFromProducts([product]);
    
    // Add all detected sizes to attributes
    sizeDetection.waist.forEach(size => attributes.sizes.add(`${size}W`));
    sizeDetection.inseam.forEach(size => attributes.sizes.add(`${size}L`));
    sizeDetection.shoes.forEach(size => attributes.sizes.add(`${size} (shoes)`));
    sizeDetection.clothing.forEach(size => attributes.sizes.add(size));
    
    // Legacy size detection for compatibility
    const clothingSizes = ['xs', 'x-small', 's', 'small', 'm', 'medium', 'l', 'large', 'xl', 'x-large', 'xxl', 'xx-large'];
    clothingSizes.forEach(size => {
      if (text.includes(size)) {
        attributes.sizes.add(size.toUpperCase());
      }
    });
    
    // Gender detection
    const genderKeywords = {
      'men': ['men', 'mens', "men's", 'male', 'masculine', 'guy', 'dude', 'man'],
      'women': ['women', 'womens', "women's", 'female', 'feminine', 'girl', 'lady', 'woman'],
      'unisex': ['unisex', 'unisex', 'gender neutral', 'for everyone']
    };
    
    Object.entries(genderKeywords).forEach(([gender, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          console.log(`🔍 Gender Match Found: "${keyword}" → "${gender}" in product: "${product.title}"`);
          attributes.genders.add(gender.charAt(0).toUpperCase() + gender.slice(1));
        }
      });
    });
  });
  
  console.log(`🔍 Final Gender Attributes Detected:`, Array.from(attributes.genders));
  console.log(`🔍 Total Products Processed:`, products.length);
  
  return attributes;
};

/**
 * Generate smart filters based on context and product data
 */
export const generateSmartFilters = (
  searchTerm: string, 
  products: any[] = []
): SmartFilterContext => {
  const detectedCategory = detectCategoryFromSearch(searchTerm);
  const productAttributes = extractProductAttributes(products);
  
  console.log(`🎯 Smart Filter Generation:`, {
    searchTerm,
    detectedCategory,
    productCount: products.length,
    productAttributes: {
      brands: Array.from(productAttributes.brands),
      genders: Array.from(productAttributes.genders),
      colors: Array.from(productAttributes.colors),
      sizes: Array.from(productAttributes.sizes)
    }
  });
  
  // Extract enhanced filters for modern e-commerce experience
  const enhancedFilters = extractEnhancedFilters(products);
  
  console.log(`🎯 Enhanced Filters:`, enhancedFilters);
  
  // Provide sensible defaults when size signals are missing to match modern retail UI
  const isJeansOrPants = /\b(jeans|denim|pants)\b/i.test(searchTerm);
  const effectiveSizes: ComprehensiveSizes = {
    waist: enhancedFilters.sizes.waist.length > 0 ? enhancedFilters.sizes.waist : (detectedCategory === 'clothing' && isJeansOrPants ? WAIST_SIZES : []),
    inseam: enhancedFilters.sizes.inseam.length > 0 ? enhancedFilters.sizes.inseam : (detectedCategory === 'clothing' && isJeansOrPants ? INSEAM_LENGTHS : []),
    clothing: enhancedFilters.sizes.clothing.length > 0 ? enhancedFilters.sizes.clothing : (detectedCategory === 'clothing' ? CLOTHING_SIZES : []),
    shoes: enhancedFilters.sizes.shoes,
  };
  if ((effectiveSizes.waist.length || effectiveSizes.inseam.length || effectiveSizes.clothing.length) &&
      (enhancedFilters.sizes.waist.length === 0 && enhancedFilters.sizes.inseam.length === 0 && enhancedFilters.sizes.clothing.length === 0)) {
    console.log('🎯 Using fallback size options for smart filters', effectiveSizes);
  }
  
  let suggestedFilters: Record<string, FilterConfig> = {};
  
  // Base filters always available
  suggestedFilters.price = {
    type: 'range',
    label: 'Price',
    min: 0,
    max: 500,
  };
  
  suggestedFilters.rating = {
    type: 'radio',
    label: 'Rating',
    options: [
      { value: '4', label: '4★ & Up' },
      { value: '3', label: '3★ & Up' },
    ]
  };
  
  suggestedFilters.shipping = {
    type: 'checkbox',
    label: 'Free Shipping',
    options: [{ value: 'free', label: 'Free Shipping' }]
  };
  
  // Add category-specific filters
  if (detectedCategory === 'clothing') {
    // Enhanced brand filter
    if (enhancedFilters.brands.length > 0) {
      suggestedFilters.brand = {
        type: 'checkbox',
        label: 'Brand',
        options: enhancedFilters.brands.map(brand => ({
          value: brand.toLowerCase(),
          label: brand
        }))
      };
    }
    
    // Enhanced size filters with separate categories
    if (effectiveSizes.waist.length > 0) {
      console.log(`🎯 Adding waist size filter with ${effectiveSizes.waist.length} options:`, effectiveSizes.waist);
      suggestedFilters.waist = {
        type: 'checkbox',
        label: 'Waist Size',
        sizeType: 'waist',
        options: effectiveSizes.waist.map(size => ({
          value: size,
          label: `${size}"`
        }))
      };
    }
    
    if (effectiveSizes.inseam.length > 0) {
      console.log(`🎯 Adding inseam length filter with ${effectiveSizes.inseam.length} options:`, effectiveSizes.inseam);
      suggestedFilters.inseam = {
        type: 'checkbox',
        label: 'Inseam Length',
        sizeType: 'inseam',
        options: effectiveSizes.inseam.map(size => ({
          value: size,
          label: `${size}"`
        }))
      };
    }
    
    if (effectiveSizes.clothing.length > 0) {
      console.log(`🎯 Adding clothing size filter with ${effectiveSizes.clothing.length} options:`, effectiveSizes.clothing);
      suggestedFilters.size = {
        type: 'checkbox',
        label: 'Clothing Size',
        sizeType: 'clothing',
        options: effectiveSizes.clothing.map(size => ({
          value: size.toLowerCase(),
          label: size
        }))
      };
    }
    
    if (enhancedFilters.sizes.shoes.length > 0) {
      console.log(`🎯 Adding shoe size filter with ${enhancedFilters.sizes.shoes.length} options:`, enhancedFilters.sizes.shoes);
      suggestedFilters.shoeSize = {
        type: 'checkbox',
        label: 'Shoe Size',
        sizeType: 'shoes',
        options: enhancedFilters.sizes.shoes.map(size => ({
          value: size,
          label: size
        }))
      };
    }
    
    // Enhanced color filter
    if (enhancedFilters.colors.length > 0) {
      console.log(`🎯 Adding color filter with ${enhancedFilters.colors.length} options:`, enhancedFilters.colors);
      suggestedFilters.color = {
        type: 'checkbox',
        label: 'Color',
        options: enhancedFilters.colors.map(color => ({
          value: color.toLowerCase(),
          label: color.charAt(0).toUpperCase() + color.slice(1)
        }))
      };
    }
    
    // Add gender filter if we detected genders
    if (productAttributes.genders.size > 0) {
      console.log(`🎯 Adding gender filter with options:`, Array.from(productAttributes.genders));
      suggestedFilters.gender = {
        type: 'checkbox',
        label: 'Gender',
        options: Array.from(productAttributes.genders).map(gender => ({
          value: gender.toLowerCase(),
          label: gender
        }))
      };
    }
    
    // Enhanced materials filter
    if (enhancedFilters.materials.length > 0) {
      suggestedFilters.material = {
        type: 'checkbox',
        label: 'Material',
        options: enhancedFilters.materials.slice(0, 8).map(material => ({
          value: material.value,
          label: material.label,
          count: material.count
        }))
      };
    }

    // Enhanced styles filter
    if (enhancedFilters.styles.length > 0) {
      suggestedFilters.style = {
        type: 'checkbox',
        label: 'Style',
        options: enhancedFilters.styles.slice(0, 6).map(style => ({
          value: style.value,
          label: style.label,
          count: style.count
        }))
      };
    }

    // Enhanced features filter
    if (enhancedFilters.features.length > 0) {
      suggestedFilters.features = {
        type: 'checkbox',
        label: 'Features',
        options: enhancedFilters.features.slice(0, 8).map(feature => ({
          value: feature.value,
          label: feature.label,
          count: feature.count
        }))
      };
    }

    // For jeans specifically, add fit types
    if (searchTerm.toLowerCase().includes('jeans')) {
      suggestedFilters.fit = {
        type: 'checkbox',
        label: 'Fit',
        options: [
          { value: 'regular', label: 'Regular Fit' },
          { value: 'relaxed', label: 'Relaxed Fit' },
          { value: 'slim', label: 'Slim Fit' },
          { value: 'skinny', label: 'Skinny Fit' },
          { value: 'straight', label: 'Straight Fit' },
        ]
      };
    }
  }
  
  return {
    searchTerm,
    detectedCategory,
    suggestedFilters,
    productAttributes,
    enhancedFilters,
  };
};