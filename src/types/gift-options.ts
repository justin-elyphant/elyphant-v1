// Unified Gift Options interface for all checkout and scheduling components
export interface GiftOptions {
  // Core gift settings
  isGift: boolean;
  recipientName: string;
  giftMessage: string;
  giftWrapping?: boolean;
  isSurpriseGift: boolean;
  
  // Scheduling options
  scheduleDelivery?: boolean;
  sendGiftMessage?: boolean;
  scheduledDeliveryDate?: string;
  
  // Legacy compatibility (can be removed after migration)
  isSurprise?: boolean;
}