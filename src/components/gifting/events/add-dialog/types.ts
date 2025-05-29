
export interface AddEventFormValues {
  eventType: string;
  personName: string;
  personId?: string;
  date: Date;
  autoGift: boolean;
  autoGiftAmount?: number;
  privacyLevel: "private" | "shared" | "public";
}

export interface EventFormData {
  eventType: string;
  personName: string;
  date: Date | null;
  privacyLevel: "private" | "shared" | "public";
  autoGiftEnabled: boolean;
  giftBudget: number;
}

export interface PersonContact {
  id: string;
  name: string;
  avatar: string;
  topGifter: boolean;
  events: number;
}
