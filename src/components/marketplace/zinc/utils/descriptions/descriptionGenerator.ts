
import { templates, defaultTemplates } from './baseTemplates';
import { getNikeDescription } from './nikeDescriptions';
import { extractProductType } from './utils';

/**
 * Generates a realistic product description based on product name and category
 */
export const generateDescription = (productName: string, category: string): string => {
  // Extract brand if possible
  const brand = productName.split(' ')[0];
  
  // Extract product type
  const productType = extractProductType(productName);
  
  // Nike-specific descriptions for athletic shoes
  if (brand.toLowerCase() === "nike" && category === "Footwear") {
    return getNikeDescription(productName);
  }
  
  // Get category templates or default to generic description
  const categoryTemplates = templates[category] || defaultTemplates;
  
  // Select a random template from the category
  const template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
  
  // Replace placeholders
  return template
    .replace(/{brand}/g, brand)
    .replace(/{productType}/g, productType)
    .trim();
};
