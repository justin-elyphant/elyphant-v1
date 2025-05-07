
import { Product } from "@/contexts/ProductContext";
import { ZincProduct } from "../types";
import { normalizeProduct } from "@/contexts/ProductContext";

/**
 * Convert a Zinc Product to our internal Product format
 */
export const convertZincProductToProduct = (zincProduct: ZincProduct): Product => {
  return normalizeProduct({
    product_id: zincProduct.product_id || `zinc-${Math.random().toString(36).substring(2, 11)}`,
    id: zincProduct.product_id || `zinc-${Math.random().toString(36).substring(2, 11)}`,
    title: zincProduct.title || "Unknown Product",
    name: zincProduct.title || "Unknown Product",
    price: typeof zincProduct.price === 'number' ? zincProduct.price : 0,
    image: zincProduct.image || zincProduct.images?.[0] || "/placeholder.svg",
    images: zincProduct.images || (zincProduct.image ? [zincProduct.image] : ["/placeholder.svg"]),
    vendor: "Amazon via Zinc",
    description: zincProduct.description || `${zincProduct.title} - A quality product from ${zincProduct.brand || 'the manufacturer'}`,
    rating: typeof zincProduct.rating === 'number' ? zincProduct.rating : 0,
    stars: typeof zincProduct.rating === 'number' ? zincProduct.rating : 0,
    reviewCount: typeof zincProduct.review_count === 'number' ? zincProduct.review_count : 0,
    num_reviews: typeof zincProduct.review_count === 'number' ? zincProduct.review_count : 0,
    brand: zincProduct.brand || "Unknown",
    category: zincProduct.category || "Electronics"
  });
};

/**
 * Check if a product is relevant to a search query
 */
export const isProductRelevantToSearch = (product: ZincProduct, query: string): boolean => {
  const lowercaseQuery = query.toLowerCase();
  const title = (product.title || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();
  const category = (product.category || "").toLowerCase();
  const description = (product.description || "").toLowerCase();
  
  // Break the query into words for more precise matching
  const queryTerms = lowercaseQuery.split(/\s+/).filter(term => term.length > 2);
  
  // Product must match at least one term in the title, brand, or category
  const hasTermMatch = queryTerms.some(term => 
    title.includes(term) || 
    brand.includes(term) || 
    category.includes(term) || 
    description.includes(term)
  );
  
  return hasTermMatch;
};
