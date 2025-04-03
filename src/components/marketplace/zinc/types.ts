
// Zinc API product type
export type ZincProduct = {
  product_id: string;
  title: string;
  price: number;
  image: string;
  description?: string;
  brand?: string;
  category?: string;
  retailer: string;
  rating?: number;
  review_count?: number;
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
  is_gift?: boolean;
  gift_message?: string;
  shipping_method?: string;
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
  retailer_credentials?: {
    email: string;
    password: string;
  };
  webhooks?: {
    request_succeeded?: string;
    request_failed?: string;
    tracking_obtained?: string;
  };
  client_notes?: {
    [key: string]: string;
  };
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
