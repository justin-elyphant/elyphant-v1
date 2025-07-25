// Unified Nicole AI type definitions

export type NicoleCapability = 
  | 'conversation'
  | 'search'
  | 'gift_advisor'
  | 'auto_gifting'
  | 'budget_analysis'
  | 'wishlist_analysis'
  | 'marketplace_assistant';

export interface UnifiedNicoleContext {
  // Core conversation context
  conversationPhase: string;
  capability: NicoleCapability;
  
  // Recipient and relationship context
  recipient?: string;
  relationship?: string;
  occasion?: string;
  exactAge?: number;
  
  // Preference and interest context
  interests?: string[];
  detectedBrands?: string[];
  budget?: [number, number];
  
  // User context
  currentUserId?: string;
  userPreferences?: any;
  
  // Conversation context
  previousMessages?: Array<{ role: string; content: string }>;
  systemPrompt?: string;
  
  // Action context
  availableActions?: string[];
  lastAction?: string;
  
  // Marketplace context (preserving existing functionality)
  searchQuery?: string;
  productContext?: any;
  marketplaceState?: any;
  
  // Gift collection workflow context
  giftCollectionPhase?: 'recipient' | 'occasion' | 'budget' | 'payment' | 'confirmation';
  recipientInfo?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  paymentMethod?: {
    type?: 'card' | 'paypal';
    details?: any;
  };
  giftSelections?: Array<{
    productId: string;
    name: string;
    price: number;
    image?: string;
  }>;
}

export interface NicoleResponse {
  message: string;
  context: UnifiedNicoleContext;
  capability: NicoleCapability;
  actions: string[];
  searchQuery?: string;
  showSearchButton: boolean;
  metadata?: {
    confidence?: number;
    suggestedFollowups?: string[];
    contextUpdates?: Partial<UnifiedNicoleContext>;
  };
}

export interface NicoleConversationState {
  sessionId: string;
  context: UnifiedNicoleContext;
  conversationHistory: Array<{ role: string; content: string }>;
  lastMessage: string;
  lastResponse: NicoleResponse | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NicoleCapabilityConfig {
  name: NicoleCapability;
  description: string;
  triggers: string[];
  contextRequirements: string[];
  availableActions: string[];
}