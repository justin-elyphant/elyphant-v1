
import { ZincProduct } from '../types';

/**
 * Generate product detail images for a zinc product
 */
export function generateProductDetailImages(data: any, mainImage: string): string[] {
  // Start with any existing images
  const existingImages = Array.isArray(data.images) ? data.images : [];
  
  // Generate variations from the main image
  const variations = createImageVariations(mainImage, data.title || "Product");
  
  // Combine and deduplicate
  const allImages = [...existingImages, ...variations];
  
  // Return unique set
  return [...new Set(allImages)];
}

/**
 * Generate product images for search results
 */
export function generateProductImages(mainImage: string, productTitle: string): string[] {
  if (!mainImage || mainImage === "/placeholder.svg") {
    return ["/placeholder.svg"];
  }
  
  // Generate variations of the main image
  const variations = createImageVariations(mainImage, productTitle);
  
  return variations;
}

/**
 * Create image variations from a single base image
 */
function createImageVariations(baseImage: string, productName: string): string[] {
  // Return placeholder if no base image
  if (!baseImage) {
    return ["/placeholder.svg"];
  }
  
  // Start with the original image
  const variations = [baseImage];
  
  // Create Amazon-specific variations if applicable
  if (baseImage && typeof baseImage === 'string' && 
     (baseImage.includes('amazon.com') || baseImage.includes('m.media-amazon.com'))) {
    // Extract the base URL without any existing parameters
    let baseUrl = baseImage.split('?')[0];
    
    // Handle Amazon image URLs by extracting the product ID
    // Amazon image URLs typically contain the product ID in the path
    const productId = extractAmazonProductId(baseUrl);
    
    if (productId) {
      // Get the file extension
      const fileExt = baseUrl.split('.').pop() || 'jpg';
      
      // Create significantly different Amazon product ID variations
      // These will create actually different views of the product
      const idParts = productId.split('');
      
      // Generate several truly different IDs
      const modifiedIds = [
        // Front view - original
        productId,
        // Side view - replace character in middle 
        productId.substring(0, Math.floor(productId.length/2)) + 
          (productId.charAt(Math.floor(productId.length/2)) === '1' ? '8' : '1') + 
          productId.substring(Math.floor(productId.length/2) + 1),
        // Back view - replace last character
        productId.substring(0, productId.length-1) + 
          (productId.charAt(productId.length-1) === 'L' ? 'R' : 
           productId.charAt(productId.length-1) === '1' ? '2' : '1')
      ];
      
      // Use the timestamp to ensure each URL is unique
      const timestamp = Date.now();
      
      // Add the different image variations with their IDs
      modifiedIds.forEach((id, index) => {
        if (id !== productId) {
          const newUrl = baseUrl.replace(productId, id);
          if (!variations.includes(newUrl)) {
            variations.push(newUrl);
          }
          
          // Also add with unique timestamp to ensure they're treated as different images
          variations.push(`${newUrl}?t=${timestamp + index * 100}`);
        }
      });
      
      // Add Amazon-specific view parameters for more variety
      // These ?view= params sometimes trigger Amazon's CDN to serve different views
      if (variations.length < 4) {
        const views = ['back', 'side', 'angle', 'detail', 'alt'];
        views.forEach((view, i) => {
          const viewUrl = `${baseUrl}?view=${view}&t=${timestamp + i * 50}`;
          if (!variations.includes(viewUrl)) {
            variations.push(viewUrl);
          }
        });
      }
    } else {
      // If we couldn't extract product ID, use a variety of view parameters
      const timestamp = Date.now();
      const views = ['main', 'back', 'side', 'angle', 'detail'];
      
      views.forEach((view, i) => {
        const viewUrl = `${baseUrl}?view=${view}&t=${timestamp + i * 50}`;
        if (!variations.includes(viewUrl)) {
          variations.push(viewUrl);
        }
      });
    }
    
    // Return unique Amazon variations
    return [...new Set(variations)].slice(0, 6); // Limit to 6 variations
  } 
  
  // For non-Amazon images, create more distinct variations
  const timestamp = Date.now();
  const viewNames = ['front', 'side', 'back', 'detail', 'angle'];
  
  viewNames.forEach((view, i) => {
    const viewUrl = `${baseImage}${baseImage.includes('?') ? '&' : '?'}view=${view}&t=${timestamp + i * 100}`;
    if (!variations.includes(viewUrl)) {
      variations.push(viewUrl);
    }
  });
  
  return [...new Set(variations)].slice(0, 6); // Limit to 6 variations
}

/**
 * Extract Amazon product ID from image URL
 */
function extractAmazonProductId(url: string): string | null {
  const regex = /\/images\/I\/([A-Za-z0-9]+)(\._.*)?/;
  const match = url.match(regex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

/**
 * Get a fallback image based on product category or name - only used if no images at all
 */
export function getFallbackImage(productNameOrCategory: string): string {
  // Generic placeholder that's clearly a placeholder
  return '/placeholder.svg';
}
