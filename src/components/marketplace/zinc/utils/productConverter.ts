
import { ZincProduct } from '../types';
import { Product } from '@/contexts/ProductContext';

/**
 * Converts a ZincProduct to the Product format used by our application
 */
export const convertZincProductToProduct = (zincProduct: ZincProduct): Product => {
  // Generate a deterministic product ID based on the product_id if available
  const getProductId = () => {
    if (!zincProduct.product_id) return Math.floor(1000 + Math.random() * 9000);
    
    // Try to generate a numeric ID from the product_id string
    try {
      // Extract a number from the product ID if possible
      const match = zincProduct.product_id.match(/\d+/);
      if (match && match[0]) {
        const numericPart = parseInt(match[0].substring(0, 4), 10); // Use first 4 digits
        return 1000 + (numericPart % 9000); // Keep within our ID range
      }
    } catch (e) {
      console.warn('Failed to parse product ID:', e);
    }
    
    // Fallback to a random ID if parsing fails
    return Math.floor(1000 + Math.random() * 9000);
  };

  return {
    id: getProductId(),
    name: zincProduct.title || "Product",
    price: typeof zincProduct.price === 'number' ? zincProduct.price : parseFloat(zincProduct.price as string) || 0,
    category: zincProduct.category || "Electronics",
    image: zincProduct.image || "/placeholder.svg",
    images: zincProduct.images || [zincProduct.image || "/placeholder.svg"],
    vendor: "Amazon via Zinc",
    description: zincProduct.description || `Details for ${zincProduct.title || "this product"}`,
    rating: zincProduct.rating,
    reviewCount: zincProduct.review_count,
    brand: zincProduct.brand || ""
  };
};

/**
 * Convert Product back to ZincProduct format when needed
 */
export const convertProductToZincProduct = (product: Product): ZincProduct => {
  return {
    product_id: `product-${product.id}`,
    title: product.name,
    price: product.price,
    image: product.image,
    images: product.images || [product.image],
    description: product.description || "",
    brand: product.brand || "",
    category: product.category,
    retailer: product.vendor,
    rating: product.rating || 0,
    review_count: product.reviewCount || 0
  };
};
