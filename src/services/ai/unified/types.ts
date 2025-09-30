// Unified Nicole AI type definitions

export type NicoleCapability = 
  | 'conversation'
  | 'search'
  | 'gift_advisor'
  | 'auto_gifting'
  | 'auto_gift_analysis'
  | 'budget_analysis'
  | 'wishlist_analysis'
  | 'marketplace_assistant';

export interface UnifiedNicoleContext {
  // Core conversation context
  conversationPhase: string;
  capability: NicoleCapability;
  
  // Connection memory for pronoun resolution
  mentionedConnection?: {
    userId: string;
    name: string;
    username: string;
    relationshipType: string;
    status: string;
  };
  lastMentionedRecipient?: string;
  
  // Auto-gift intelligence context
  autoGiftIntelligence?: {
    hasIntelligence: boolean;
    primaryRecommendation?: {
      recipientName: string;
      recipientId: string;
      occasionType: string;
      occasionDate: string;
      budgetRange: [number, number];
      confidence: number;
    };
    alternativeOptions?: Array<{
      recipientName: string;
      occasionType: string;
      occasionDate: string;
    }>;
    canUseOptimalFlow: boolean;
  };
  
  // CTA Context Awareness
  selectedIntent?: "auto-gift" | "shop-solo" | "create-wishlist" | "giftor";
  source?: string;
  
  // Post-auth welcome context  
  userFirstName?: string;
  
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
  collectionProgress?: {
    recipient: boolean;
    occasion: boolean;
    budget: boolean;
    phone: boolean;
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
  
  // Dynamic greeting context
  greetingContext?: {
    greeting?: string;
    firstName?: string;
    userProfile?: any;
    friendName?: string;
    activeMode?: string;
    giftorName?: string;
    occasion?: string;
  };
}

export interface NicoleResponse {
  message: string;
  context: UnifiedNicoleContext;
  capability: NicoleCapability;
  actions: string[];
  searchQuery?: string;
  showSearchButton: boolean;
  showProductTiles?: boolean;
  ctaData?: {
    type: 'auto_gift_setup' | 'gift_recommendations' | 'wishlist_creation';
    label: string;
    recipientName?: string;
    occasion?: string;
    budgetRange?: [number, number];
    confidence?: number;
  };
  metadata?: {
    confidence?: number;
    suggestedFollowups?: string[];
    contextUpdates?: Partial<UnifiedNicoleContext>;
    agentModel?: boolean;
    threadId?: string;
    fallback?: boolean;
    ctaData?: {
      type: 'auto_gift_setup' | 'gift_recommendations' | 'wishlist_creation';
      label: string;
      recipientName?: string;
      occasion?: string;
      budgetRange?: [number, number];
      confidence?: number;
    };
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