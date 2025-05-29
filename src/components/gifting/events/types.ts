import { PrivacyLevel } from "@/utils/privacyUtils";

export interface PersonContact {
  id: string;
  name: string;
  avatar?: string;
  topGifter?: boolean;
  events?: number;
}

export type FilterOption = "all" | "birthday" | "anniversary" | "holiday" | "graduation" | "wedding" | "other";

export interface Filter {
  type: FilterOption;
  date: Date | null;
  privacy: PrivacyLevel | null;
}

export interface ExtendedEventData {
  id: string;
  type: string;
  person: string;
  date: string;
  daysAway: number;
  avatarUrl?: string;
  autoGiftEnabled: boolean;
  autoGiftAmount: number;
  privacyLevel: "private" | "shared" | "public";
  isVerified: boolean;
  needsVerification: boolean;
  giftSource: "wishlist" | "marketplace";
  dateObj?: Date;
  isRecurring?: boolean;
  recurringType?: "yearly" | "monthly" | "custom";
  originalEventId?: string;
}

export interface AddEventFormValues {
  eventType: string;
  personName: string;
  personId?: string;
  date: Date;
  autoGift: boolean;
  autoGiftAmount?: number;
  privacyLevel: "private" | "shared" | "public";
  isRecurring: boolean;
  recurringType?: "yearly" | "monthly" | "custom";
}

export interface EventFormData {
  eventType: string;
  personName: string;
  date: Date | null;
  privacyLevel: "private" | "shared" | "public";
  autoGiftEnabled: boolean;
  giftBudget: number;
  isRecurring: boolean;
  recurringType?: "yearly" | "monthly" | "custom";
}
