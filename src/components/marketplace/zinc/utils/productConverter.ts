
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
  const price = typeof zincProduct.price === 'string' 
    ? parseFloat(zincProduct.price) || 0
    : (zincProduct.price || 0);
  
  return {
    id: zincProduct.product_id,
    name: zincProduct.title,
    price: price,
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
  return {
    product_id: product.id.toString(),
    title: product.name,
    price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
    description: product.description,
    category: product.category,
    retailer: "Amazon via Zinc",
    image: product.image,
    images: product.images || [product.image],
    rating: typeof product.rating === 'number' ? product.rating : (parseFloat(String(product.rating)) || 0),
    review_count: typeof product.reviewCount === 'number' ? product.reviewCount : (parseInt(String(product.reviewCount), 10) || 0),
    brand: product.brand || (product.vendor === "Amazon via Zinc" ? "Amazon" : product.vendor)
  };
};
