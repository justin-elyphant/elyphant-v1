// Zinc API Variant Specific type (for individual variation dimensions)
export type ZincVariantSpecific = {
  dimension: string;
  value: string;
};

// Zinc API Variant type (represents a single product variant)
export type ZincVariant = {
  variant_specifics: ZincVariantSpecific[];
  product_id: string;
};

// Zinc API Package Dimensions type
export type ZincPackageDimension = {
  amount: number;
  unit: string;
};

// Zinc API EPID type
export type ZincEpid = {
  type: string;
  value: string;
};

// Enhanced Zinc API product type with full API response structure
export type ZincProduct = {
  // Core product information
  product_id: string;
  title: string;
  price: number;
  
  // Images
  main_image?: string;
  image?: string; // Backward compatibility
  images?: string[];
  
  // Product details
  product_details?: string[];
  feature_bullets?: string[];
  product_description?: string;
  brand?: string;
  categories?: string[];
  authors?: string[];
  
  // Variations - NEW CORE FEATURE
  variant_specifics?: ZincVariantSpecific[];
  all_variants?: ZincVariant[];
  
  // Pricing and ratings
  original_retail_price?: number;
  stars?: number;
  review_count?: number;
  question_count?: number;
  
  // Product metadata
  asin?: string;
  epids?: ZincEpid[];
  epids_map?: string[];
  package_dimensions?: ZincPackageDimension[];
  item_location?: string;
  item_number?: string;
  
  // Product flags
  fresh?: boolean;
  pantry?: boolean;
  handmade?: boolean;
  digital?: boolean;
  buyapi_hint?: boolean;
  
  // API metadata
  status?: string;
  retailer?: string;
  timestamp?: string;
  
  // Backward compatibility fields (legacy)
  description?: string;
  category?: string;
  rating?: number;
  num_reviews?: number;
  num_sales?: number;
  features?: string[];
  specifications?: Record<string, string>;
  isBestSeller?: boolean;
};

// Zinc Order type (used by orderService.ts)
export type ZincOrder = {
  id: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  retailer?: string;
  products?: {
    product_id: string;
    quantity: number;
  }[];
  shipping_address?: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2?: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
    phone_number: string;
  };
  tracking_number?: string;
  estimated_delivery?: string;
  total_price?: number;
  
  // Mock data properties
  customerName?: string;
  date?: string;
  items?: { 
    name: string; 
    quantity: number; 
    price: number 
  }[];
  total?: number;
  
  // Supabase order data properties (for OrderDetail page)
  shipping_info?: any;
  [key: string]: any; // Allow additional properties
};

// Zinc Return type (used by returnService.ts)
export type ZincReturn = {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  items: {
    product_id: string;
    quantity: number;
    reason: string;
  }[];
  refund_amount?: number;
  refund_status?: string;
  
  // Mock data properties
  orderId?: string;
  customerName?: string;
  item?: { 
    name: string; 
    price: number 
  };
  reason?: string;
  requestDate?: string;
  completionDate?: string | null;
  creditIssued?: boolean;
};

// Zinc API order request type
export type ZincOrderRequest = {
  retailer: string;
  products: {
    product_id: string;
    quantity: number;
  }[];
  shipping_address: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2?: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
    phone_number: string;
  };
  payment_method: {
    name_on_card: string;
    number: string;
    expiration_month: number;
    expiration_year: number;
    security_code: string;
  };
  billing_address: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2?: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
    phone_number: string;
  };
  shipping_method?: string; // New: Selected shipping method ID
  is_gift?: boolean;
  gift_message?: string; // Gift message (max 255 chars)
  delivery_instructions?: string; // Special delivery instructions
  delivery_date_preference?: string; // Preferred delivery date (ISO string)
  retailer_credentials?: {
    email: string;
    password: string;
  };
  is_test?: boolean; // Property to indicate test orders
};

// Zinc API return request type
export type ZincReturnRequest = {
  retailer: string;
  order_id: string;
  items: {
    product_id: string;
    quantity: number;
    reason: string;
  }[];
  refund_method?: {
    name_on_card: string;
    number: string;
    expiration_month: number;
    expiration_year: number;
    security_code: string;
  };
  retailer_credentials?: {
    email: string;
    password: string;
  };
  webhooks?: {
    request_succeeded?: string;
    request_failed?: string;
  };
  client_notes?: {
    [key: string]: string;
  };
};

// Amazon retailer credentials type
export type AmazonCredentials = {
  email: string;
  password: string;
};
