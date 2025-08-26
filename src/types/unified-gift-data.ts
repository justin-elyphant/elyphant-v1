// Unified types for gift-related data across the application

export interface GiftSetupData {
  recipientName: string;
  recipientEmail?: string;
  relationshipType: string;
  giftingEvents: Array<{
    dateType: string;
    date: string;
    isRecurring: boolean;
    customName?: string;
  }>;
  budget?: string;
  specialRequests?: string;
  giftPreferences?: string[];
  autoGiftingEnabled?: boolean;
  scheduledGiftingEnabled?: boolean;
  budgetLimit?: number;
  giftCategories?: string[];
  notificationDays?: number[];
  connectionId?: string;
  shippingAddress?: any;
  [key: string]: any;
}

export interface AutoGiftRule {
  id: string;
  user_id: string;
  recipient_id?: string;
  pending_recipient_email?: string;
  date_type: string;
  event_id?: string;
  is_active: boolean;
  budget_limit?: number;
  gift_selection_criteria?: {
    source: 'wishlist' | 'ai' | 'both';
    categories: string[];
    max_price?: number;
    min_price?: number;
    exclude_items?: string[];
  };
  notification_preferences?: {
    enabled: boolean;
    days_before: number[];
    email: boolean;
    push: boolean;
  };
  gift_preferences?: any;
  payment_method_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledGift {
  id: string;
  productName: string;
  productImage: string;
  recipientName: string;
  scheduledDate: Date;
  status: 'scheduled' | 'sent' | 'failed';
  type: 'ai-automated' | 'manual-scheduled';
  budgetAmount?: number;
  orderReference?: string;
}