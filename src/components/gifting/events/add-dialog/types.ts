
export interface EventFormData {
  title?: string;
  description?: string;
  date: Date | null;
  dateType?: string;
  specificHoliday?: string;
  personId?: string;
  eventType: string;
  personName: string;
  privacyLevel: "public" | "private" | "shared";
  autoGiftEnabled: boolean;
  giftBudget: number;
  isRecurring: boolean;
  recurringType: "yearly" | "monthly" | "custom";
  maxOccurrences?: number;
  endDate?: string;
  visibility?: "public" | "friends" | "private";
  autoGift?: boolean;
}

export interface AddEventFormValues {
  eventType: string;
  personName: string;
  date: Date | null;
  specificHoliday?: string;
  privacyLevel: "public" | "private" | "shared";
  autoGiftEnabled: boolean;
  giftBudget: number;
  isRecurring: boolean;
  recurringType: "yearly" | "monthly" | "custom";
}
