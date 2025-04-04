
import { ZincProduct } from "../types";
import { Product } from "@/contexts/ProductContext";

/**
 * Converts a ZincProduct to the application's Product format
 */
export const convertZincProductToProduct = (zincProduct: ZincProduct): Product => {
  // Handle price conversion - sometimes the API returns cents instead of dollars
  let price: number;
  if (typeof zincProduct.price === 'number') {
    // If price is very large, assume it's in cents and convert to dollars
    price = zincProduct.price > 1000 ? zincProduct.price / 100 : zincProduct.price;
  } else {
    // Handle string values or undefined cases
    price = zincProduct.price ? parseFloat(String(zincProduct.price)) : 0;
  }
  
  // Ensure we have a valid rating value
  const rating = zincProduct.rating || zincProduct.stars || 4.5;
  
  // Ensure we have a valid review count
  const reviewCount = zincProduct.review_count || zincProduct.num_reviews || 100;
  
  // Ensure we have an image array
  const images = Array.isArray(zincProduct.images) && zincProduct.images.length > 0 
    ? zincProduct.images 
    : [zincProduct.image || "/placeholder.svg"];
  
  // Extract the brand name, ensuring it's not an empty string
  const brand = zincProduct.brand || extractBrandFromTitle(zincProduct.title || "");
  
  return {
    id: Date.now() + Math.floor(Math.random() * 1000), // Generate a unique ID
    name: zincProduct.title || "Unknown Product",
    price: price,
    category: zincProduct.category || "Electronics",
    image: zincProduct.image || "/placeholder.svg",
    vendor: "Amazon via Zinc",
    description: zincProduct.description || `High-quality product from ${brand || 'a trusted brand'}.`,
    rating: rating,
    reviewCount: reviewCount,
    images: images,
    features: zincProduct.features || [],
    specifications: zincProduct.specifications || {},
    isBestSeller: zincProduct.isBestSeller || false,
    // Add the brand name to help with filtering
    brand: brand
  };
};

/**
 * Extract brand name from product title
 */
const extractBrandFromTitle = (title: string): string => {
  // Common brand words that might appear at the beginning of titles
  const commonBrands = [
    'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Microsoft', 'Dell', 'HP', 
    'LG', 'Bose', 'Amazon', 'Google', 'Logitech', 'Levi\'s', 'Nintendo', 'Canon',
    'Lego', 'Lululemon'
  ];
  
  for (const brand of commonBrands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // Return the first word as a fallback
  return title.split(' ')[0];
};
