
// Common types for Zinc API integration

export interface ZincProduct {
  product_id: string;
  title: string;
  price: number;
  image: string;
  description?: string;
  brand?: string;
  category?: string;
  retailer: string;
}

export interface ZincOrder {
  id: string;
  status: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  date: string;
}

export interface ZincReturn {
  id: string;
  orderId: string;
  customerName: string;
  item: { name: string; price: number };
  reason: string;
  status: string;
  requestDate: string;
  completionDate: string | null;
  refundAmount: number | null;
  creditIssued: boolean;
}
