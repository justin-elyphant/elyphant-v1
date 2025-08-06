import { supabase } from "@/integrations/supabase/client";

interface ConnectionAnalysis {
  id: string;
  name: string;
  relationship: string;
  relationshipStrength: number; // 1-10 scale
  upcomingEvents: EventPrediction[];
  suggestedBudget: BudgetRange;
  hasWishlist: boolean;
  pastGiftHistory: GiftHistory[];
}

interface EventPrediction {
  type: 'birthday' | 'anniversary' | 'holiday' | 'custom';
  date: string;
  daysAway: number;
  confidence: number; // 0-1 scale
  source: 'profile' | 'ai_detected' | 'user_specified';
}

interface BudgetRange {
  min: number;
  max: number;
  recommended: number;
  reasoning: string;
}

interface GiftHistory {
  occasion: string;
  amount: number;
  success: boolean;
  date: string;
}

interface IntelligenceContext {
  primaryRecommendation: {
    recipient: ConnectionAnalysis;
    occasion: EventPrediction;
    budget: BudgetRange;
    confidence: number;
  } | null;
  alternativeOptions: Array<{
    recipient: ConnectionAnalysis;
    occasion: EventPrediction;
    budget: BudgetRange;
  }>;
  smartDefaults: {
    hasConnectionsToAnalyze: boolean;
    canPredictOccasions: boolean;
    hasBudgetIntelligence: boolean;
  };
}

export class AutoGiftIntelligenceService {
  private static instance: AutoGiftIntelligenceService;
  private intelligenceCache: Map<string, IntelligenceContext> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): AutoGiftIntelligenceService {
    if (!AutoGiftIntelligenceService.instance) {
      AutoGiftIntelligenceService.instance = new AutoGiftIntelligenceService();
    }
    return AutoGiftIntelligenceService.instance;
  }

  /**
   * Pre-analyze user's connections and generate intelligent auto-gift recommendations
   */
  async analyzeUserAutoGiftOpportunities(userId: string): Promise<IntelligenceContext> {
    const cacheKey = `intelligence_${userId}`;
    
    // Check cache first
    const cached = this.intelligenceCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Fetch user connections with enhanced data
      const connections = await this.fetchUserConnections(userId);
      
      if (connections.length === 0) {
        const emptyContext: IntelligenceContext = {
          primaryRecommendation: null,
          alternativeOptions: [],
          smartDefaults: {
            hasConnectionsToAnalyze: false,
            canPredictOccasions: false,
            hasBudgetIntelligence: false
          }
        };
        this.cacheIntelligence(cacheKey, emptyContext);
        return emptyContext;
      }

      // Analyze each connection for auto-gift potential
      const analyzedConnections = await Promise.all(
        connections.map(conn => this.analyzeConnection(conn, userId))
      );

      // Find the best primary recommendation
      const primaryRecommendation = this.selectPrimaryRecommendation(analyzedConnections);
      
      // Generate alternative options
      const alternativeOptions = this.generateAlternativeOptions(analyzedConnections, primaryRecommendation);

      const intelligenceContext: IntelligenceContext = {
        primaryRecommendation,
        alternativeOptions,
        smartDefaults: {
          hasConnectionsToAnalyze: connections.length > 0,
          canPredictOccasions: analyzedConnections.some(conn => conn.upcomingEvents.length > 0),
          hasBudgetIntelligence: true // We always have relationship-based budget intelligence
        }
      };

      // Cache the result
      this.cacheIntelligence(cacheKey, intelligenceContext);

      return intelligenceContext;
    } catch (error) {
      console.error('AutoGiftIntelligenceService: Analysis error:', error);
      
      // Return safe fallback
      return {
        primaryRecommendation: null,
        alternativeOptions: [],
        smartDefaults: {
          hasConnectionsToAnalyze: false,
          canPredictOccasions: false,
          hasBudgetIntelligence: false
        }
      };
    }
  }

  /**
   * Generate smart Question 1: Combined recipient + occasion confirmation
   */
  generateSmartQuestion1(intelligence: IntelligenceContext): string {
    if (!intelligence.primaryRecommendation) {
      return "I'd love to help you set up auto-gifting! Let me know who you'd like to set this up for and I'll analyze their upcoming events.";
    }

    const { recipient, occasion } = intelligence.primaryRecommendation;
    const alternativeCount = intelligence.alternativeOptions.length;
    
    let message = `I see ${recipient.name}'s ${occasion.type} is coming up on ${occasion.date}. Should I set up automatic gifting for ${recipient.name}'s ${occasion.type}?`;
    
    if (alternativeCount > 0) {
      const alt = intelligence.alternativeOptions[0];
      message += ` I can also add ${alt.recipient.name}'s ${alt.occasion.type} in ${alt.occasion.date} if you'd like both covered.`;
    }

    return message;
  }

  /**
   * Generate smart Question 2: Intelligent budget confirmation
   */
  generateSmartQuestion2(recipient: ConnectionAnalysis): string {
    const { suggestedBudget, relationship } = recipient;
    
    return `Perfect! Based on your ${relationship} relationship with ${recipient.name}, I suggest $${suggestedBudget.min}-${suggestedBudget.max} for gifts. ${suggestedBudget.reasoning} Sound good, or would you prefer a different range?`;
  }

  /**
   * Check if we can skip to 2-question flow
   */
  canUseOptimalFlow(intelligence: IntelligenceContext): boolean {
    return intelligence.primaryRecommendation !== null && 
           intelligence.primaryRecommendation.confidence > 0.7;
  }

  private async fetchUserConnections(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_connections')
      .select(`
        *,
        profiles!user_connections_connected_user_id_fkey (
          id,
          display_name,
          username,
          avatar_url,
          birth_year,
          interests
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching connections:', error);
      return [];
    }

    return data || [];
  }

  private async analyzeConnection(connection: any, userId: string): Promise<ConnectionAnalysis> {
    const profile = connection.profiles;
    const name = profile?.display_name || profile?.username || 'Unknown';
    
    // Predict upcoming events
    const upcomingEvents = await this.predictUpcomingEvents(connection, profile);
    
    // Calculate relationship-based budget
    const suggestedBudget = this.calculateRelationshipBudget(connection);
    
    // Check for wishlist (placeholder for future implementation)
    const hasWishlist = Math.random() > 0.6; // Mock data for now
    
    // Fetch past gift history (placeholder for future implementation)
    const pastGiftHistory: GiftHistory[] = []; // Mock data for now
    
    return {
      id: connection.connected_user_id,
      name,
      relationship: connection.relationship_type || 'friend',
      relationshipStrength: this.calculateRelationshipStrength(connection),
      upcomingEvents,
      suggestedBudget,
      hasWishlist,
      pastGiftHistory
    };
  }

  private async predictUpcomingEvents(connection: any, profile: any): Promise<EventPrediction[]> {
    const events: EventPrediction[] = [];
    const currentDate = new Date();
    
    // Birthday prediction from birth_year
    if (profile?.birth_year) {
      const currentYear = currentDate.getFullYear();
      const birthMonth = Math.floor(Math.random() * 12) + 1; // Mock birth month
      const birthDay = Math.floor(Math.random() * 28) + 1; // Mock birth day
      
      const birthdayThisYear = new Date(currentYear, birthMonth - 1, birthDay);
      const birthdayNextYear = new Date(currentYear + 1, birthMonth - 1, birthDay);
      
      const nextBirthday = birthdayThisYear > currentDate ? birthdayThisYear : birthdayNextYear;
      const daysAway = Math.ceil((nextBirthday.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysAway <= 90) { // Only include if within 90 days
        events.push({
          type: 'birthday',
          date: nextBirthday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          daysAway,
          confidence: 0.9,
          source: 'profile'
        });
      }
    }
    
    // Connection anniversary (when they connected)
    if (connection.created_at) {
      const connectionDate = new Date(connection.created_at);
      const anniversaryThisYear = new Date(
        currentDate.getFullYear(),
        connectionDate.getMonth(),
        connectionDate.getDate()
      );
      const anniversaryNextYear = new Date(
        currentDate.getFullYear() + 1,
        connectionDate.getMonth(),
        connectionDate.getDate()
      );
      
      const nextAnniversary = anniversaryThisYear > currentDate ? anniversaryThisYear : anniversaryNextYear;
      const daysAway = Math.ceil((nextAnniversary.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysAway <= 60 && daysAway >= 7) { // Include if within 60 days but not too soon
        events.push({
          type: 'anniversary',
          date: nextAnniversary.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          daysAway,
          confidence: 0.6,
          source: 'ai_detected'
        });
      }
    }
    
    return events.sort((a, b) => a.daysAway - b.daysAway);
  }

  private calculateRelationshipBudget(connection: any): BudgetRange {
    const baseAmount = 50;
    const relationshipType = connection.relationship_type || 'friend';
    
    let multiplier = 1.0;
    let reasoning = '';
    
    switch (relationshipType.toLowerCase()) {
      case 'family':
      case 'sibling':
      case 'parent':
      case 'child':
        multiplier = 1.4;
        reasoning = 'Family relationships typically warrant higher gift budgets.';
        break;
      case 'close_friend':
      case 'best_friend':
        multiplier = 1.2;
        reasoning = 'Close friendships deserve thoughtful, quality gifts.';
        break;
      case 'colleague':
      case 'coworker':
        multiplier = 0.8;
        reasoning = 'Professional relationships call for modest, appropriate gifts.';
        break;
      case 'acquaintance':
        multiplier = 0.6;
        reasoning = 'Casual relationships are best with simple, thoughtful gestures.';
        break;
      default: // friend
        multiplier = 1.0;
        reasoning = 'A standard budget works well for good friends.';
    }
    
    const recommended = Math.round(baseAmount * multiplier);
    const min = Math.round(recommended * 0.7);
    const max = Math.round(recommended * 1.3);
    
    return {
      min,
      max,
      recommended,
      reasoning
    };
  }

  private calculateRelationshipStrength(connection: any): number {
    // Base relationship strength on type and duration
    const relationshipType = connection.relationship_type || 'friend';
    const connectionAge = Date.now() - new Date(connection.created_at).getTime();
    const daysConnected = connectionAge / (1000 * 60 * 60 * 24);
    
    let baseStrength = 5; // Default 5/10
    
    switch (relationshipType.toLowerCase()) {
      case 'family':
      case 'sibling':
      case 'parent':
      case 'child':
        baseStrength = 9;
        break;
      case 'close_friend':
      case 'best_friend':
        baseStrength = 8;
        break;
      case 'friend':
        baseStrength = 6;
        break;
      case 'colleague':
      case 'coworker':
        baseStrength = 4;
        break;
      case 'acquaintance':
        baseStrength = 3;
        break;
    }
    
    // Adjust based on connection duration
    if (daysConnected > 365) baseStrength += 1; // Long-term relationship
    if (daysConnected > 30) baseStrength += 0.5; // Established relationship
    
    return Math.min(10, Math.max(1, baseStrength));
  }

  private selectPrimaryRecommendation(connections: ConnectionAnalysis[]): IntelligenceContext['primaryRecommendation'] {
    if (connections.length === 0) return null;
    
    // Score each connection based on multiple factors
    const scoredConnections = connections.map(conn => {
      if (conn.upcomingEvents.length === 0) return { connection: conn, score: 0 };
      
      const nearestEvent = conn.upcomingEvents[0];
      
      // Scoring factors:
      // - Relationship strength (40%)
      // - Event urgency - closer is better (30%)
      // - Event confidence (20%)
      // - Has wishlist bonus (10%)
      
      const relationshipScore = (conn.relationshipStrength / 10) * 0.4;
      const urgencyScore = Math.max(0, (90 - nearestEvent.daysAway) / 90) * 0.3;
      const confidenceScore = nearestEvent.confidence * 0.2;
      const wishlistBonus = conn.hasWishlist ? 0.1 : 0;
      
      const totalScore = relationshipScore + urgencyScore + confidenceScore + wishlistBonus;
      
      return {
        connection: conn,
        event: nearestEvent,
        score: totalScore
      };
    }).filter(item => item.score > 0);
    
    if (scoredConnections.length === 0) return null;
    
    // Select the highest scoring connection
    const best = scoredConnections.sort((a, b) => b.score - a.score)[0];
    
    return {
      recipient: best.connection,
      occasion: best.event,
      budget: best.connection.suggestedBudget,
      confidence: best.score
    };
  }

  private generateAlternativeOptions(
    connections: ConnectionAnalysis[], 
    primary: IntelligenceContext['primaryRecommendation']
  ): IntelligenceContext['alternativeOptions'] {
    if (!primary) return [];
    
    return connections
      .filter(conn => conn.id !== primary.recipient.id && conn.upcomingEvents.length > 0)
      .slice(0, 2) // Limit to 2 alternatives
      .map(conn => ({
        recipient: conn,
        occasion: conn.upcomingEvents[0],
        budget: conn.suggestedBudget
      }));
  }

  private cacheIntelligence(key: string, intelligence: IntelligenceContext): void {
    this.intelligenceCache.set(key, intelligence);
    
    // Auto-cleanup cache after expiry
    setTimeout(() => {
      this.intelligenceCache.delete(key);
    }, this.cacheExpiry);
  }

  /**
   * Clear all cached intelligence data
   */
  clearCache(): void {
    this.intelligenceCache.clear();
  }
}

export const autoGiftIntelligenceService = AutoGiftIntelligenceService.getInstance();