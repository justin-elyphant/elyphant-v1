
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
    retailer: "Amazon",
    description: zincProduct.description || `${zincProduct.title} - A quality product from ${zincProduct.brand || 'the manufacturer'}`,
    rating: zincProduct.stars ?? zincProduct.rating ?? 0,
    stars: zincProduct.stars ?? zincProduct.rating ?? 0,
    reviewCount: zincProduct.review_count ?? zincProduct.num_reviews ?? 0,
    num_reviews: zincProduct.review_count ?? zincProduct.num_reviews ?? 0,
    brand: zincProduct.brand || "Unknown",
    category: zincProduct.category || "Electronics",
    // CRITICAL: Zinc product identification metadata
    productSource: 'zinc_api',
    isZincApiProduct: true,
    skipCentsDetection: false
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

/**
 * Convert a mock product to the ZincProduct format
 * This allows us to use our mock product data with Zinc-specific code
 */
export const convertMockToZincProduct = (mockProduct: any): ZincProduct => {
  return {
    product_id: mockProduct.id || mockProduct.product_id || `mock-${Math.random().toString(36).substring(2, 11)}`,
    title: mockProduct.title || mockProduct.name || "Unknown Product",
    price: typeof mockProduct.price === 'number' ? mockProduct.price : 0,
    image: mockProduct.image || "/placeholder.svg",
    images: mockProduct.images || [mockProduct.image || "/placeholder.svg"],
    description: mockProduct.description || `${mockProduct.title || mockProduct.name} - A quality product`,
    brand: mockProduct.brand || "Unknown",
    category: mockProduct.category || mockProduct.category_name || "General",
    retailer: "Amazon",
    rating: mockProduct.rating || mockProduct.stars || 0,
    review_count: mockProduct.reviewCount || mockProduct.num_reviews || 0,
    features: mockProduct.features || [],
    isBestSeller: !!mockProduct.isBestSeller
  };
};
