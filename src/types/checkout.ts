export interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  image: string;
  product_id: string;
  quantity: number;
  vendor?: string;
  retailer?: string;
  variationText?: string;
  selectedVariations?: string;
  // Phase C: Fulfillment routing
  fulfillment_method?: 'zinc_api' | 'vendor_direct';
  vendor_account_id?: string;
}