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
}