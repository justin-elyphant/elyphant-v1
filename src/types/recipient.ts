
export interface RecipientAssignment {
  connectionId: string;
  connectionName: string;
  deliveryGroupId: string;
  giftMessage?: string;
  scheduledDeliveryDate?: string;
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
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
}
