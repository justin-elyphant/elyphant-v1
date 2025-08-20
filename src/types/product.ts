
/**
 * Shared Product type definition for the application
 * This ensures consistency across all components
 */
export type Product = {
  // Required fields
  product_id: string;
  title: string;
  price: number;
  image: string;
  
  // Fields that may have aliases
  id?: string; // Alias for product_id
  name?: string; // Alias for title
  category?: string; // Alias for category_name
  category_name?: string;
  vendor?: string;
  retailer?: string;
  rating?: number; // Alias for stars
  stars?: number;
  reviewCount?: number; // Alias for num_reviews
  num_reviews?: number;
  
  // Optional fields that might be present in some products
  description?: string;
  brand?: string;
  images?: string[];
  addon?: boolean;
  fresh?: boolean;
  num_offers_estimate?: null|number;
  num_sales?: number;
  pantry?: boolean;
  prime?: boolean;
  product_details?: any[];
  features?: string[];
  isBestSeller?: boolean;
  variants?: string[];
  
  // Enhanced best seller fields from Zinc API
  bestSellerType?: 'amazon_choice' | 'best_seller' | 'popular' | 'top_rated' | 'highly_rated' | null;
  badgeText?: string | null;
  best_seller_rank?: number;
  sales_rank?: number;
  badges?: string[];
  
  // New fields for wishlist and preference tracking
  tags?: string[];
  fromWishlist?: boolean;
  fromPreferences?: boolean;
  
  // Unified pricing strategy fields
  productSource?: 'zinc_api' | 'shopify' | 'vendor_portal' | 'manual';
  skipCentsDetection?: boolean;
  isZincApiProduct?: boolean; // Legacy compatibility flag
};
