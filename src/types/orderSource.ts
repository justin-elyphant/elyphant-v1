export interface OrderSourceAnalysis {
  sourceType: 'standard' | 'scheduled' | 'auto_gift' | 'ai_auto_gift';
  recipientInfo?: {
    id: string;
    name: string;
    canShow: boolean; // privacy check
  };
  scheduledDate?: string;
  aiAttribution?: {
    agent: 'nicole';
    confidence: number;
    discoveryMethod: string;
  };
  approvalInfo?: {
    status: 'auto_approved' | 'manually_approved';
    approvedAt?: string;
    approvedVia?: string;
  };
  selectedProducts?: Array<{
    productId: string;
    name: string;
    image: string | null;
    price: number;
    confidence?: number;
  }>;
  giftMessage?: string;
  executionId?: string;
}

export interface AddressMetadata {
  // Metadata fields
  source: 'user_verified' | 'giver_provided' | 'missing';
  is_verified: boolean;
  needs_confirmation: boolean;
  connection_id?: string;
  
  // Shipping address fields (required for order creation)
  name: string;
  email: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  zip_code: string;  // Duplicate for compatibility
  country: string;
  phone?: string;
}

export interface AutoGiftExecution {
  id: string;
  user_id: string;
  rule_id?: string;
  event_id?: string;
  execution_date: string;
  status: string;
  selected_products?: any;
  address_metadata?: AddressMetadata | any;
  ai_agent_source?: {
    agent: string;
    confidence_score: number;
    discovery_method?: string;
  };
  order_id?: string;
  gift_message?: string;
  total_amount?: number;
  created_at: string;
  updated_at?: string;
}

export interface ApprovalToken {
  id: string;
  user_id: string;
  execution_id?: string;
  token: string;
  approved_at?: string;
  rejected_at?: string;
  approved_via?: string;
  rejection_reason?: string;
  expires_at: string;
  created_at: string;
}