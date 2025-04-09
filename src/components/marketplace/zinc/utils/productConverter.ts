
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
  
  // Convert price to number with fallback
  const priceValue = typeof zincProduct.price === 'number' 
    ? zincProduct.price 
    : parseFloat(String(zincProduct.price || 0)) || 0;
  
  // Convert rating to number with fallback
  const rating = typeof zincProduct.rating === 'number' 
    ? zincProduct.rating 
    : parseFloat(String(zincProduct.rating || 0)) || 0;
      
  // Convert review count to number with fallback
  const reviewCount = typeof zincProduct.review_count === 'number'
    ? zincProduct.review_count
    : parseInt(String(zincProduct.review_count || 0), 10) || 0;
  
  // Convert the string product_id to a number, or generate a random number if conversion fails
  const productIdAsNumber = zincProduct.product_id 
    ? parseInt(String(zincProduct.product_id).replace(/\D/g, ''), 10) || Math.floor(Math.random() * 100000)
    : Math.floor(Math.random() * 100000);
  
  return {
    id: productIdAsNumber,
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
  // For product_id, ensure we have a string (force conversion)
  const productId = String(product.id);
  
  // Explicitly handle price to ensure it's a number
  let priceValue: number = 0;
  if (typeof product.price === 'number') {
    priceValue = product.price;
  } else {
    // Handle string or any other type by explicit parsing
    priceValue = parseFloat(String(product.price || 0)) || 0;
  }
  
  // Explicitly handle rating to ensure it's a number
  let ratingValue: number = 0;
  if (typeof product.rating === 'number') {
    ratingValue = product.rating;
  } else if (product.rating) {
    // Only try to parse if it's defined
    ratingValue = parseFloat(String(product.rating)) || 0;
  }
  
  // Explicitly handle review count to ensure it's a number
  let reviewCountValue: number = 0;
  if (typeof product.reviewCount === 'number') {
    reviewCountValue = product.reviewCount;
  } else if (product.reviewCount) {
    // Only try to parse if it's defined
    reviewCountValue = parseInt(String(product.reviewCount), 10) || 0;
  }
  
  return {
    product_id: productId,
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
