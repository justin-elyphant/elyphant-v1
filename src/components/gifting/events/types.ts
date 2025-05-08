
export interface EventData {
  id: number;
  type: string;
  person: string;
  date: string;
  daysAway: number;
  avatarUrl: string;
  autoGiftEnabled: boolean;
  autoGiftAmount?: number;
  giftSource?: "wishlist" | "ai" | "both" | "specific";
  paymentMethodId?: string;
  selectedProductId?: string;
}

export interface ExtendedEventData extends EventData {
  privacyLevel: string;
  isVerified?: boolean;
  needsVerification?: boolean;
  giftSource?: "wishlist" | "ai" | "both" | "specific";
  dateObj?: Date | null;
  paymentMethodId?: string;
  selectedProductId?: string;
}

export type FilterOption = "all" | string;
