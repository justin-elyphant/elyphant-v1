
export interface Product {
  id?: string;
  product_id?: string; // For API compatibility
  name?: string;
  title?: string; // For API compatibility
  price?: number;
  image?: string;
  images?: string[];
  rating?: number;
  stars?: number; // For API compatibility
  reviewCount?: number;
  review_count?: number; // For API compatibility
  num_reviews?: number; // For API compatibility
  vendor?: string;
  category?: string;
  description?: string;
  product_description?: string; // For API compatibility
  variants?: string[];
  variant_specifics?: any[]; // For API compatibility
  product_details?: string[]; // For API compatibility
  isBestSeller?: boolean;
  brand?: string;
  main_image?: string; // For API compatibility
  [key: string]: any; // Fallback for any other fields
}
