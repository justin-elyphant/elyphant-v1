// Zinc API product type
export type ZincProduct = {
  product_id: string;
  title: string;
  price: number;
  image: string;
  images?: string[];
  description?: string;
  brand?: string;
  category?: string;
  retailer: string;
  // Support both naming conventions from the API
  rating?: number;
  review_count?: number;
  stars?: number;
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
    zip_code: string;
    city: string;
    state: string;
    country: string;
    phone_number: string;
  };
  is_gift?: boolean;
  retailer_credentials?: {
    email: string;
    password: string;
  };
  is_test?: boolean; // New property to indicate test orders
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
