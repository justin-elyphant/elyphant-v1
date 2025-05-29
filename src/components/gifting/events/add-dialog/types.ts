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

export interface PersonContact {
  id: string;
  name: string;
  avatar: string;
  topGifter: boolean;
  events: number;
}
