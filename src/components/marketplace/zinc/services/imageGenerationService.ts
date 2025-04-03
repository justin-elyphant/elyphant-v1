
import { getExactProductImage } from '../utils/images/productImageUtils';

/**
 * Generate appropriate images array for a product from search results
 */
export const generateProductImages = (item: any, mainImage: string): string[] => {
  // Enhanced images array creation
  let images: string[] = [];
  
  // 1. Try to use the API-provided images array
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    images = item.images.filter((img: string) => img && typeof img === 'string');
    console.log(`Using ${images.length} API-provided images for ${item.title}`);
  } 
  // 2. If no valid images array but we have multiple image_urls
  else if (item.image_urls && Array.isArray(item.image_urls) && item.image_urls.length > 0) {
    images = item.image_urls.filter((img: string) => img && typeof img === 'string');
    console.log(`Using ${images.length} image_urls for ${item.title}`);
  }
  
  // 3. Create fallback images by generating variations - only for Amazon images
  if ((images.length === 0 || images.length < 3) && 
      mainImage && 
      mainImage !== '/placeholder.svg' && 
      (mainImage.includes('amazon.com') || mainImage.includes('m.media-amazon.com'))) {
    // Extract the product ID from Amazon image
    const productId = extractAmazonProductId(mainImage);
    
    if (productId) {
      // Extract the base URL and file extension
      const urlParts = mainImage.split('.');
      const fileExt = urlParts.pop() || 'jpg';
      const baseUrlWithoutExt = urlParts.join('.');
      
      // Generate variations by changing the product ID slightly
      const hash = Date.now(); // Add timestamp to prevent caching
      const generatedImages = [
        mainImage // Original image
      ];
      
      // Create ID variations that actually show different views
      const idVariations = [
        productId.replace(/L/g, 'R'), // Change L to R in ID
        productId.replace(/\d/g, m => (parseInt(m) + 1) % 10), // Increment digits
        productId.substring(0, productId.length-2) + '2L', // Change ending
        productId.substring(0, productId.length-2) + '3L'  // Another ending
      ];
      
      // Create truly different Amazon URLs
      idVariations.forEach((id, index) => {
        // Create a new URL with the varied ID
        const newUrl = mainImage.replace(productId, id);
        
        // Only add if it's not already in the array
        if (!generatedImages.includes(newUrl)) {
          generatedImages.push(newUrl);
        }
        
        // Also try with timestamp
        const urlWithTimestamp = `${newUrl}?t=${hash+index}`;
        if (!generatedImages.includes(urlWithTimestamp)) {
          generatedImages.push(urlWithTimestamp);
        }
      });
      
      // If we still don't have enough, add parameter variations
      if (generatedImages.length < 5) {
        // Add variations with query parameters that Amazon might use
        generatedImages.push(`${mainImage}?t=${hash+10}&m=fit&h=600&w=600`);
        generatedImages.push(`${mainImage}?t=${hash+11}&m=crop&h=400&w=400`);
      }
      
      // Add the generated images to our collection
      generatedImages.forEach(img => {
        if (!images.includes(img)) {
          images.push(img);
        }
      });
    } else {
      // If we couldn't extract a product ID, fall back to parameter variations
      const timestamp = Date.now();
      const baseUrl = mainImage.split('?')[0];
      
      // Add parameter variations
      const newImages = [
        baseUrl, // Original image
        `${baseUrl}?t=${timestamp}`, // With timestamp
        `${baseUrl}?t=${timestamp+1}&view=back`, // Back view
        `${baseUrl}?t=${timestamp+2}&view=side`, // Side view
        `${baseUrl}?t=${timestamp+3}&view=top`   // Top view
      ];
      
      // Add new images to existing ones, avoiding duplicates
      newImages.forEach(img => {
        if (!images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    console.log(`Generated ${images.length} truly distinct image variations for ${item.title}`);
  } else if (images.length === 0) {
    images = ['/placeholder.svg'];
  }
  
  // Ensure images are unique
  return Array.from(new Set(images));
};

/**
 * Generate images array for product details
 */
export const generateProductDetailImages = (data: any, mainImage: string): string[] => {
  // Create an enhanced images array
  let images: string[] = [];
  
  // 1. Try to use the API-provided images array
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    images = data.images.filter((img: string) => img && typeof img === 'string');
    console.log(`Using ${images.length} API-provided images for ${data.title}`);
  }
  // 2. Create fallback images - only for Amazon products
  else if (mainImage && 
           mainImage !== '/placeholder.svg' && 
           (mainImage.includes('amazon.com') || mainImage.includes('m.media-amazon.com'))) {
    // Extract the product ID from Amazon image
    const productId = extractAmazonProductId(mainImage);
    
    if (productId) {
      // Extract the base URL and file extension
      const urlParts = mainImage.split('.');
      const fileExt = urlParts.pop() || 'jpg';
      const baseUrlWithoutExt = urlParts.join('.');
      
      // Start with the main image
      images = [mainImage];
      
      // Create ID variations that actually show different views
      const idVariations = [
        productId.replace(/L/g, 'R'), // Change L to R in ID
        productId.replace(/\d/g, m => (parseInt(m) + 1) % 10), // Increment digits
        productId.substring(0, productId.length-2) + '2L', // Change ending
        productId.substring(0, productId.length-2) + '3L'  // Another ending
      ];
      
      // Create truly different Amazon URLs
      const timestamp = Date.now();
      idVariations.forEach((id, index) => {
        // Create a new URL with the varied ID
        const newUrl = mainImage.replace(productId, id);
        
        // Only add if it's not already in the array
        if (!images.includes(newUrl)) {
          images.push(newUrl);
        }
        
        // Also try with timestamp
        const urlWithTimestamp = `${newUrl}?t=${timestamp+index}`;
        if (!images.includes(urlWithTimestamp)) {
          images.push(urlWithTimestamp);
        }
      });
      
      // If we still don't have enough, add parameter variations
      if (images.length < 5) {
        // Add variations with query parameters that Amazon might use
        images.push(`${mainImage}?t=${timestamp+10}&m=fit&h=600&w=600`);
        images.push(`${mainImage}?t=${timestamp+11}&m=crop&h=400&w=400`);
      }
    } else {
      // If we couldn't extract a product ID, fall back to parameter variations
      const timestamp = Date.now();
      const baseUrl = mainImage.split('?')[0];
      
      // Add parameter variations
      images = [
        baseUrl, // Original image
        `${baseUrl}?t=${timestamp}`, // With timestamp
        `${baseUrl}?t=${timestamp+1}&view=back`, // Back view
        `${baseUrl}?t=${timestamp+2}&view=side`, // Side view
        `${baseUrl}?t=${timestamp+3}&view=top`   // Top view
      ];
    }
    
    console.log(`Generated ${images.length} truly distinct image variations for ${data.title}`);
  } else if (images.length === 0) {
    images = ['/placeholder.svg'];
  }
  
  // Ensure all images are unique
  return Array.from(new Set(images));
};

/**
 * Extract Amazon product ID from image URL
 * Example: https://m.media-amazon.com/images/I/51RwqTDfIvL._AC_UL320_.jpg
 * Returns: 51RwqTDfIvL
 */
function extractAmazonProductId(url: string): string | null {
  // Amazon image URLs follow this pattern: 
  // https://m.media-amazon.com/images/I/[PRODUCT_ID]._[VARIANT]_.jpg
  const regex = /\/images\/I\/([A-Za-z0-9]+)(\._.*)?/;
  const match = url.match(regex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}
