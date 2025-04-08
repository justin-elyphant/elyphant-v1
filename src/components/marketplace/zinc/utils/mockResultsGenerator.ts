
import { ZincProduct } from '../types';
import { generateDescription } from './productDescriptionUtils';
import { generatePrice } from './pricing/priceRanges';
import { getExactProductImage } from './images/productImageUtils';
import { getBrandFromTitle } from './brands/brandUtils';
import { generateTitle } from './titles/titleGenerator';

/**
 * Create realistic mock search results for a query
 */
export const createMockResults = (
  query: string, 
  category: string = 'Electronics', 
  count: number = 10, 
  minRating: number = 3.5, 
  maxRating: number = 5.0,
  brand?: string,
  accuratePricing: boolean = true // Changed to true by default
): ZincProduct[] => {
  const results: ZincProduct[] = [];
  
  // Create product variants with different attributes
  for (let i = 0; i < count; i++) {
    // Generate a product ID that's unique but repeatable for the same query
    const productId = `ZINC-${query.replace(/\s/g, '-')}-${i}`.substring(0, 24);
    
    // Generate a title that includes the query and some variations
    const title = generateTitle(query, category, brand, i);
    
    // Generate a rating between min and max, weighted toward higher ratings
    const rating = Number((minRating + Math.random() * (maxRating - minRating)).toFixed(1));
    
    // Generate a variable number of reviews
    const reviewCount = Math.floor(20 + Math.random() * 980);
    
    // Always use accurate category-based pricing
    const price = generatePrice(category);
    
    // Generate a real product image URL based on title and category
    const imageUrl = getExactProductImage(title, category);
    
    // Generate multiple images for each product
    const additionalImages = [
      getExactProductImage(title + " variant", category),
      getExactProductImage(title + " accessory", category)
    ];
    
    // Generate a detailed product description
    const description = generateDescription(title, category);
    
    results.push({
      product_id: productId,
      title: title,
      price: price,
      image: imageUrl,
      images: [imageUrl, ...additionalImages],
      description: description,
      brand: brand || getBrandFromTitle(title),
      category: category,
      retailer: "Amazon via Zinc",
      rating: rating,
      review_count: reviewCount
    });
  }
  
  return results;
};
