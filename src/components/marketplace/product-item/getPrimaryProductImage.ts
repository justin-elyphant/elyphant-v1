
import { Product } from "@/types/product";
import { getProductFallbackImage } from "./productImageUtils";
import { getRandomMockProductImage } from "./mockProductImages";

const MOCK_PLACEHOLDER_IMAGE = "/placeholder.svg";

/**
 * Determines the best image for a product, guaranteeing a visible photo for all mock/test/Zinc products.
 * Priority: valid image field > valid image in images[] > mock placeholder (for mock/Zinc/etc) > fallback image
 */
export function getPrimaryProductImage(product: Product): string {
  const mainImg = (product.image || "").trim();
  const isMissingImg = !mainImg || mainImg === MOCK_PLACEHOLDER_IMAGE;

  // Helper: Is this a mock/Zinc product? - robustly detects test + Zinc mock results
  const isMock = isMockProduct(product);

  // Guarantee custom mock image for any mock product (unless it has a real image)
  if (isMock) {
    // If a real/valid non-placeholder image, use it
    if (!isMissingImg && mainImg && !mainImg.includes(MOCK_PLACEHOLDER_IMAGE)) return mainImg;
    if (Array.isArray(product.images)) {
      const validImg = product.images.find(img => img && img !== MOCK_PLACEHOLDER_IMAGE && !img.includes(MOCK_PLACEHOLDER_IMAGE));
      if (validImg) return validImg;
    }
    // Always return one of the mock product images, even if product.image or product.images is empty/invalid
    const seed = typeof product.product_id === "string"
      ? product.product_id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
      : Math.floor(Math.random() * 1000);
    return getRandomMockProductImage(seed);
  }

  // For non-mock: use main image if valid
  if (!isMissingImg && mainImg && mainImg !== MOCK_PLACEHOLDER_IMAGE) return mainImg;

  // Use array images for non-mock
  if (Array.isArray(product.images) && product.images.length > 0) {
    const validImg = product.images.find(img => !!img && img !== MOCK_PLACEHOLDER_IMAGE);
    if (validImg) return validImg;
  }

  // Last fallback - category-specific real image
  return getProductFallbackImage(
    product.title || product.name || "Product",
    product.category || ""
  );
}

// Helper: Is this a mock/test/Zinc product?
function isMockProduct(product: Product): boolean {
  // Robust check
  return (
    (product.product_id && String(product.product_id).toUpperCase().startsWith("MOCK")) ||
    (typeof product.product_id === "string" && product.product_id.startsWith("mock-")) ||
    (typeof product.retailer === "string" && product.retailer.toLowerCase().includes("zinc")) ||
    (typeof product.vendor === "string" && product.vendor.toLowerCase().includes("zinc")) ||
    (product.title && product.title.toLowerCase().includes("mock")) ||
    (product.name && product.name.toLowerCase().includes("mock"))
  );
}
