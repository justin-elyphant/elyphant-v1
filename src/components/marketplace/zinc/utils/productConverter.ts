
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
  
  return {
    id: zincProduct.product_id,
    name: zincProduct.title,
    price: zincProduct.price,
    description: description,
    category: zincProduct.category || "Unknown",
    vendor: "Amazon via Zinc",
    image: productImage,
    images: productImages,
    rating: typeof zincProduct.rating === 'number' ? zincProduct.rating : 0,
    reviewCount: typeof zincProduct.review_count === 'number' ? zincProduct.review_count : 0,
    brand: zincProduct.brand || "Unknown",  // Add brand field to ensure it's populated
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
  return {
    product_id: product.id.toString(),
    title: product.name,
    price: product.price,
    description: product.description,
    category: product.category,
    retailer: "Amazon via Zinc",
    image: product.image,
    images: product.images || [product.image],
    rating: product.rating,
    review_count: product.reviewCount,
    brand: product.brand || (product.vendor === "Amazon via Zinc" ? "Amazon" : product.vendor)
  };
};
