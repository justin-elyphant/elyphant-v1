
export type FilterOption = "all" | "birthday" | "anniversary" | "holiday" | "other";

export type PrivacyLevel = "private" | "shared" | "public";

export type GiftSource = "wishlist" | "marketplace" | "ai_selected";

export type RecurringType = "yearly" | "monthly" | "custom";

export interface ExtendedEventData {
  id: string;
  type: string;
  person: string;
  date: string;
  daysAway: number;
  avatarUrl?: string;
  autoGiftEnabled: boolean;
  autoGiftAmount?: number;
  privacyLevel: PrivacyLevel;
  isVerified?: boolean;
  needsVerification?: boolean;
  giftSource?: GiftSource;
  dateObj?: Date;
  isRecurring?: boolean;
  recurringType?: RecurringType;
  originalEventId?: string;
  
  // New series management fields
  seriesId?: string;
  endDate?: string;
  maxOccurrences?: number;
  isModified?: boolean;
  occurrenceNumber?: number;
}

export interface EventEditData {
  type: string;
  person: string;
  date: Date;
  privacyLevel: PrivacyLevel;
  autoGiftEnabled: boolean;
  autoGiftAmount?: number;
  isRecurring: boolean;
  recurringType?: RecurringType;
  endDate?: Date;
  maxOccurrences?: number;
}

export interface SeriesEditOptions {
  editType: 'this_only' | 'this_and_future' | 'entire_series';
}

export interface DeleteOptions {
  deleteType: 'this_only' | 'all_future' | 'entire_series';
}
