
/**
 * Helper functions for generating product images
 */

/**
 * Create multiple mock images for a product
 */
export const createProductImages = (mainImage: string, productTitle: string): string[] => {
  if (!mainImage || mainImage === "/placeholder.svg") {
    return ["/placeholder.svg"];
  }
  
  // Generate 3-5 mock images based on the main image
  // In a real app these would come from the API
  const numImages = Math.floor(Math.random() * 3) + 3; // 3-5 images
  const images = [mainImage];
  
  // Create variation of the main image URL to simulate different product views
  for (let i = 1; i < numImages; i++) {
    // Add a parameter to the URL to make it look like a different image
    const imageUrl = mainImage.includes('?') 
      ? `${mainImage}&view=${i}` 
      : `${mainImage}?view=${i}`;
    images.push(imageUrl);
  }
  
  return images;
};
