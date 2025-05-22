import { Product } from "@/types/product";
import { getProductFallbackImage } from "./productImageUtils";

// Consistent placeholder for all mock/test products
const MOCK_PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=500&fit=crop";

/**
 * Determines the best image for a product, guaranteeing a visible photo for all mock/test products.
 * Priority: product.image (if valid) > valid image in images[] > mock placeholder > fallback image
 */
export function getPrimaryProductImage(product: Product): string {
  // Use main image if present and not a placeholder
  if (product.image && product.image !== "/placeholder.svg") {
    if (isMockProduct(product)) {
      // Force the mock placeholder for mock products
      return MOCK_PLACEHOLDER_IMAGE;
    }
    return product.image;
  }
  // Use first valid image in the array
  if (Array.isArray(product.images) && product.images.length > 0) {
    const validImg = product.images.find(
      (img) => !!img && img !== "/placeholder.svg"
    );
    if (validImg) {
      if (isMockProduct(product)) {
        return MOCK_PLACEHOLDER_IMAGE;
      }
      return validImg;
    }
  }
  // Mock detection (product_id starts with MOCK, retailer indicates Zinc, title contains "mock", etc.)
  if (isMockProduct(product)) {
    return MOCK_PLACEHOLDER_IMAGE;
  }
  // Otherwise, fallback to generated placeholder
  return getProductFallbackImage(
    product.title || product.name || "Product",
    product.category || ""
  );
}

// Helper: Is this a mock product? Used for robust detection
function isMockProduct(product: Product): boolean {
  return (
    (product.product_id && String(product.product_id).startsWith("MOCK")) ||
    (typeof product.retailer === "string" &&
      product.retailer.toLowerCase().includes("zinc")) ||
    (product.title && product.title.toLowerCase().includes("mock"))
  );
}
