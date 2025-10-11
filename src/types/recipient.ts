
export interface RecipientAssignment {
  connectionId: string;
  connectionName: string;
  deliveryGroupId: string;
  giftMessage?: string;
  scheduledDeliveryDate?: string;
  shippingAddress?: {
    name: string;
    address: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  // Address verification fields
  address_verified?: boolean;
  address_verification_method?: string;
  address_verified_at?: string;
  address_last_updated?: string;
}

export interface CartItemWithRecipient {
  productId: string;
  quantity: number;
  recipientAssignment?: RecipientAssignment;
}

export interface DeliveryGroup {
  id: string;
  connectionId: string;
  connectionName: string;
  items: string[]; // product IDs
  giftMessage?: string;
  scheduledDeliveryDate?: string;
  shippingAddress?: RecipientAssignment['shippingAddress'];
  isPrivateAddress?: boolean;
  address_verified?: boolean;
  address_verification_method?: string;
  address_verified_at?: string;
  address_last_updated?: string;
}
