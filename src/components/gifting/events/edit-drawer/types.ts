
import { ExtendedEventData } from "../types";

export type PrivacyLevel = "private" | "shared" | "public";
export type GiftSource = "wishlist" | "ai" | "both";

export interface EventFormValues {
  type: string;
  person: string;
  date: string;
  autoGiftEnabled: boolean;
  autoGiftAmount: number;
  giftSource: GiftSource;
  privacyLevel: PrivacyLevel;
}

export interface EditDrawerProps {
  event: ExtendedEventData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (eventId: number, updatedEvent: Partial<ExtendedEventData>) => void;
}
