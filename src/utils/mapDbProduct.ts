import { Product } from "@/types/product";

/**
 * Shared mapper: converts a Supabase `products` table row into the Product type.
 * Includes price-validation logic:
 *  - Skips products with price <= 0 or null (returns null)
 *  - Auto-corrects cents-as-dollars for Amazon products (price > 200 → divide by 100)
 */
export const mapDbProductToProduct = (row: any): Product | null => {
  let price = typeof row.price === "number" ? row.price : parseFloat(row.price);

  // Reject invalid prices
  if (!price || price <= 0 || isNaN(price)) return null;

  // Heuristic: Amazon prices > 200 are likely stored in cents
  if (price > 200 && (row.retailer === "amazon" || row.retailer === "Amazon")) {
    price = price / 100;
  }

  return {
    product_id: row.product_id || row.id,
    title: row.title || "",
    price,
    image: row.image_url || "/placeholder.svg",
    category: row.category || "general",
    vendor: row.retailer || "Amazon",
    retailer: row.retailer || "Amazon",
    brand: row.brand || "",
    rating: row.metadata?.stars || 0,
    stars: row.metadata?.stars || 0,
    reviewCount: row.metadata?.review_count || 0,
    review_count: row.metadata?.review_count || 0,
    description: row.metadata?.product_description || "",
    images: row.metadata?.images || [],
    metadata: row.metadata || {},
    productSource: "zinc_api" as const,
    isZincApiProduct: true,
  };
};

/**
 * Maps an array of DB rows, filtering out products with invalid prices.
 */
export const mapDbProductsToProducts = (rows: any[]): Product[] => {
  return rows.map(mapDbProductToProduct).filter((p): p is Product => p !== null);
};
