/**
 * Smart filter detection based on search context and product data
 */

export interface SmartFilterContext {
  searchTerm: string;
  detectedCategory: string | null;
  suggestedFilters: Record<string, any>;
  productAttributes: Record<string, Set<string>>;
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
    
    // Color detection
    const colors = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'grey', 'navy', 'dark', 'light'];
    colors.forEach(color => {
      if (text.includes(color)) {
        attributes.colors.add(color.charAt(0).toUpperCase() + color.slice(1));
      }
    });
    
    // Size detection for clothing
    const clothingSizes = ['xs', 'x-small', 's', 'small', 'm', 'medium', 'l', 'large', 'xl', 'x-large', 'xxl', 'xx-large'];
    const pantSizes = ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42'];
    
    [...clothingSizes, ...pantSizes].forEach(size => {
      if (text.includes(size)) {
        attributes.sizes.add(size.toUpperCase());
      }
    });
    
    // Extract waist sizes for jeans specifically
    const waistMatch = text.match(/\b(\d{2})\s?(inch|")\s?(waist|w)\b/);
    if (waistMatch) {
      attributes.sizes.add(`${waistMatch[1]}"`);
    }
  });
  
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
  
  let suggestedFilters: Record<string, any> = {};
  
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
    // Add brand filter if we detected brands from products
    if (productAttributes.brands.size > 0) {
      suggestedFilters.brand = {
        type: 'checkbox',
        label: 'Brand',
        options: Array.from(productAttributes.brands).map(brand => ({
          value: brand.toLowerCase(),
          label: brand
        }))
      };
    }
    
    // Add size filter if we detected sizes
    if (productAttributes.sizes.size > 0) {
      suggestedFilters.size = {
        type: 'checkbox',
        label: 'Size',
        options: Array.from(productAttributes.sizes).map(size => ({
          value: size.toLowerCase(),
          label: size
        }))
      };
    }
    
    // Add color filter if we detected colors
    if (productAttributes.colors.size > 0) {
      suggestedFilters.color = {
        type: 'checkbox',
        label: 'Color',
        options: Array.from(productAttributes.colors).map(color => ({
          value: color.toLowerCase(),
          label: color
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
  };
};