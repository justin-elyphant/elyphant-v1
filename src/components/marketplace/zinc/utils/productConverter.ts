
import { ZincProduct } from "../types";
import { Product } from "@/contexts/ProductContext";

/**
 * Converts a ZincProduct to the application's Product format
 */
export const convertZincProductToProduct = (zincProduct: ZincProduct): Product => {
  // Handle price conversion - sometimes the API returns cents instead of dollars
  const price = typeof zincProduct.price === 'number' ? 
    (zincProduct.price > 1000 ? zincProduct.price / 100 : zincProduct.price) : 
    parseFloat(String(zincProduct.price)) || 0;
    
  return {
    id: Date.now() + Math.floor(Math.random() * 1000), // Generate a unique ID
    name: zincProduct.title,
    price: price,
    category: zincProduct.category || "Electronics",
    image: zincProduct.image || "/placeholder.svg",
    vendor: "Amazon via Zinc",
    description: zincProduct.description || `High-quality product from ${zincProduct.brand || 'a trusted brand'}.`,
    rating: zincProduct.rating || zincProduct.stars || 4.5,
    reviewCount: zincProduct.review_count || zincProduct.num_reviews || 100,
    images: zincProduct.images || [zincProduct.image || "/placeholder.svg"],
    features: zincProduct.features || [],
    specifications: zincProduct.specifications || {},
    isBestSeller: zincProduct.isBestSeller || false
  };
};
