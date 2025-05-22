
import { Product } from "@/types/product";
import { getProductFallbackImage } from "./productImageUtils";

// Consistent placeholder for all mock/test/Zinc products (guaranteed valid visible image)
const MOCK_PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=500&fit=crop";

/**
 * Determines the best image for a product, guaranteeing a visible photo for all mock/test/Zinc products.
 * Priority: valid image field > valid image in images[] > mock placeholder (for mock/Zinc/etc) > fallback image
 */
export function getPrimaryProductImage(product: Product): string {
  const mainImg = (product.image || "").trim();
  const isMissingImg = !mainImg || mainImg === "/placeholder.svg";

  // Helper: Is this a mock/Zinc product? - robustly detects test + Zinc mock results
  const isMock = isMockProduct(product);

  // Logging (remove for prod, but useful for debugging image flow)
  console.log("[ProductImageSelect]", {
    product_id: product.product_id,
    retailer: product.retailer,
    image: product.image,
    images: product.images,
    isMock
  });

  // Guarantee mock placeholder for any mock product (unless it has a real image)
  if (isMock) {
    // If there is a real/valid non-placeholder image, use it, else force mock image.
    if (!isMissingImg) return mainImg;
    if (product.images && Array.isArray(product.images)) {
      const validImg = product.images.find(img => img && img !== "/placeholder.svg");
      if (validImg) return validImg;
    }
    return MOCK_PLACEHOLDER_IMAGE;
  }

  // For non-mock: use main image if valid
  if (!isMissingImg) return mainImg;

  // Use array images for non-mock
  if (Array.isArray(product.images) && product.images.length > 0) {
    const validImg = product.images.find(img => !!img && img !== "/placeholder.svg");
    if (validImg) return validImg;
  }

  // Last fallback
  return getProductFallbackImage(
    product.title || product.name || "Product",
    product.category || ""
  );
}

// Helper: Is this a mock/test/Zinc product?
function isMockProduct(product: Product): boolean {
  return (
    (product.product_id && String(product.product_id).toUpperCase().startsWith("MOCK")) ||
    (typeof product.retailer === "string" && product.retailer.toLowerCase().includes("zinc")) ||
    (product.title && product.title.toLowerCase().includes("mock"))
  );
}
