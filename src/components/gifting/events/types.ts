
export interface EventData {
  id: number;
  type: string;
  person: string;
  date: string;
  daysAway: number;
  avatarUrl: string;
  autoGiftEnabled: boolean;
  autoGiftAmount?: number;
  giftSource?: "wishlist" | "ai" | "both";
}

export interface ExtendedEventData extends EventData {
  privacyLevel: string;
  isVerified?: boolean;
  needsVerification?: boolean;
  giftSource?: "wishlist" | "ai" | "both";
  dateObj?: Date | null; // Add this property to fix the type error
}

export type FilterOption = "all" | string;
