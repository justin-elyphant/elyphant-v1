
import { ExtendedEventData } from "../types";

export type PrivacyLevel = "private" | "shared" | "public";
export type GiftSource = "wishlist" | "ai" | "both" | "specific";

export interface EventFormValues {
  type: string;
  person: string;
  date: string;
  autoGiftEnabled: boolean;
  autoGiftAmount: number;
  giftSource: GiftSource;
  privacyLevel: PrivacyLevel;
  selectedProductId?: string;
}

export interface EditDrawerProps {
  event: ExtendedEventData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (eventId: string, updatedEvent: Partial<ExtendedEventData>) => void; // Changed from number to string
}
