
import { ZincProduct } from "../types";
import { Product } from "@/contexts/ProductContext";

/**
 * Convert a Zinc product to our Product format
 */
export const convertZincProductToProduct = (zincProduct: ZincProduct): Product => {
  // Make sure we're handling images properly
  const productImage = zincProduct.images?.[0] || zincProduct.image || "/placeholder.svg";
  const productImages = zincProduct.images || (zincProduct.image ? [zincProduct.image] : ["/placeholder.svg"]);
  
  // Create a formatted description
  const description = zincProduct.description || 
    `${zincProduct.title} by ${zincProduct.brand || 'Unknown'} - ${zincProduct.category || 'Product'}`;
  
  // Convert string ratings to number if needed
  const rating = typeof zincProduct.rating === 'number' 
    ? zincProduct.rating 
    : typeof zincProduct.rating === 'string'
      ? parseFloat(zincProduct.rating) || 0
      : 0;
      
  // Convert string review counts to number if needed
  const reviewCount = typeof zincProduct.review_count === 'number'
    ? zincProduct.review_count
    : typeof zincProduct.review_count === 'string'
      ? parseInt(zincProduct.review_count, 10) || 0
      : 0;
  
  // Ensure price is always a number
  let priceValue = 0; // Initialize with a default value
  if (typeof zincProduct.price === 'number') {
    priceValue = zincProduct.price;
  } else if (typeof zincProduct.price === 'string') {
    priceValue = parseFloat(zincProduct.price) || 0;
  }
  
  return {
    id: zincProduct.product_id,
    name: zincProduct.title,
    price: priceValue,
    description: description,
    category: zincProduct.category || "Unknown",
    vendor: "Amazon via Zinc",
    image: productImage,
    images: productImages,
    rating: rating,
    reviewCount: reviewCount,
    brand: zincProduct.brand || "Unknown", 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Store the original zinc product data too
    originalZincProduct: zincProduct
  };
};

/**
 * Convert our Product format back to a Zinc product
 */
export const convertProductToZincProduct = (product: Product): ZincProduct => {
  // Ensure all numeric values are properly typed
  const priceValue = typeof product.price === 'number' 
    ? product.price 
    : typeof product.price === 'string'
      ? parseFloat(product.price) || 0 
      : 0;
    
  const ratingValue = typeof product.rating === 'number'
    ? product.rating
    : typeof product.rating === 'string'
      ? parseFloat(String(product.rating)) || 0
      : 0;
    
  const reviewCountValue = typeof product.reviewCount === 'number'
    ? product.reviewCount
    : typeof product.reviewCount === 'string'
      ? parseInt(String(product.reviewCount), 10) || 0
      : 0;
  
  return {
    product_id: String(product.id),
    title: product.name,
    price: priceValue,
    description: product.description || "",
    category: product.category,
    retailer: "Amazon via Zinc",
    image: product.image,
    images: product.images || [product.image],
    rating: ratingValue,
    review_count: reviewCountValue,
    brand: product.brand || (product.vendor === "Amazon via Zinc" ? "Amazon" : product.vendor)
  };
};
