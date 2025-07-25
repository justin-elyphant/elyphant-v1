
export type FilterOption = "all" | "birthday" | "anniversary" | "holiday" | "other";

export type PrivacyLevel = "private" | "shared" | "public";

export type GiftSource = "wishlist" | "marketplace" | "ai_selected";

export type RecurringType = "yearly" | "monthly" | "custom";

export type EventCategory = "self" | "others" | "shared";

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
  
  // Recipient connection details
  recipientEmail?: string;
  relationshipType?: string;
  connectionId?: string;
  connectionStatus?: string;
  
  // Auto-gifting rule details
  giftingRuleId?: string;
  giftCategories?: string[];
  notificationDays?: number[];
  giftSelectionCriteria?: any;
  
  // Event categorization
  eventCategory?: EventCategory;
  isUserRecipient?: boolean;
  isSharedEvent?: boolean;
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
