/**
 * AI-powered Gift Recommendation Service
 * Integrates with Nicole to provide intelligent product suggestions
 */

import { supabase } from "@/integrations/supabase/client";

interface GiftContext {
  recipient?: string;
  recipientId?: string;
  occasion?: string;
  budget?: [number, number];
  interests?: string[];
  relationship?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface GiftRecommendation {
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  vendor: string;
  purchaseUrl: string;
  matchScore: number;
  explanation: string;
  matchReasons: string[];
}

interface RecommendationResponse {
  recommendations: GiftRecommendation[];
  searchQuery: string;
  confidence: number;
  totalSearched: number;
  reasoning: string;
}

export class GiftRecommendationService {
  /**
   * Generate AI-powered gift recommendations based on conversation context
   */
  static async generateRecommendations(context: GiftContext): Promise<RecommendationResponse> {
    try {
      console.log('🎁 Generating AI gift recommendations with context:', context);

      // Build intelligent search query from context
      const searchQuery = this.buildSearchQuery(context);
      
      // Get product recommendations from Zinc API via edge function
      const { data: productData, error: productError } = await supabase.functions.invoke('get-products', {
        body: { 
          query: searchQuery,
          maxResults: 20,
          priceRange: context.budget ? {
            min: context.budget[0],
            max: context.budget[1]
          } : undefined
        }
      });

      if (productError) {
        throw new Error(`Product search failed: ${productError.message}`);
      }

      // Enhance recommendations with AI reasoning
      const recommendations = await this.enhanceWithAIReasoning(
        productData.products || [],
        context
      );

      // Score and rank recommendations
      const rankedRecommendations = this.scoreAndRankRecommendations(recommendations, context);

      return {
        recommendations: rankedRecommendations.slice(0, 8), // Top 8 recommendations
        searchQuery,
        confidence: this.calculateConfidence(context, rankedRecommendations),
        totalSearched: productData.products?.length || 0,
        reasoning: this.generateRecommendationReasoning(context, rankedRecommendations)
      };

    } catch (error) {
      console.error('Failed to generate gift recommendations:', error);
      throw error;
    }
  }

  /**
   * Build an intelligent search query from conversation context
   */
  private static buildSearchQuery(context: GiftContext): string {
    const queryParts: string[] = [];

    // Add occasion-specific terms
    if (context.occasion) {
      const occasion = context.occasion.toLowerCase();
      if (occasion.includes('birthday')) {
        queryParts.push('birthday gift');
      } else if (occasion.includes('anniversary')) {
        queryParts.push('anniversary gift romantic');
      } else if (occasion.includes('christmas')) {
        queryParts.push('christmas holiday gift');
      } else {
        queryParts.push(`${context.occasion} gift`);
      }
    }

    // Add interest-based terms
    if (context.interests && context.interests.length > 0) {
      queryParts.push(...context.interests.slice(0, 3)); // Top 3 interests
    }

    // Add relationship context
    if (context.relationship) {
      const relationship = context.relationship.toLowerCase();
      if (['spouse', 'partner', 'wife', 'husband'].some(r => relationship.includes(r))) {
        queryParts.push('romantic thoughtful');
      } else if (['friend', 'colleague'].some(r => relationship.includes(r))) {
        queryParts.push('friendly casual');
      } else if (['parent', 'mom', 'dad'].some(r => relationship.includes(r))) {
        queryParts.push('family parent');
      }
    }

    // Add recipient context from conversation
    if (context.conversationHistory) {
      const mentionedItems = this.extractMentionedItems(context.conversationHistory);
      queryParts.push(...mentionedItems.slice(0, 2));
    }

    // Ensure we have a basic query
    if (queryParts.length === 0) {
      queryParts.push('popular gifts');
    }

    return queryParts.join(' ').trim();
  }

  /**
   * Extract mentioned items/preferences from conversation history
   */
  private static extractMentionedItems(conversationHistory: Array<{ role: string; content: string }>): string[] {
    const mentionedItems: string[] = [];
    
    // Common gift category patterns
    const categoryPatterns = [
      /\b(books?|reading|literature)\b/i,
      /\b(tech|gadget|electronic|device)\b/i,
      /\b(jewelry|necklace|earring|ring)\b/i,
      /\b(clothing|clothes|fashion|apparel)\b/i,
      /\b(fitness|workout|gym|exercise)\b/i,
      /\b(cooking|kitchen|chef|food)\b/i,
      /\b(art|creative|craft|painting)\b/i,
      /\b(music|audio|headphone|speaker)\b/i,
      /\b(travel|adventure|outdoor|hiking)\b/i,
      /\b(beauty|skincare|makeup|cosmetic)\b/i
    ];

    for (const message of conversationHistory) {
      if (message.role === 'user') {
        const content = message.content.toLowerCase();
        
        for (const pattern of categoryPatterns) {
          const match = content.match(pattern);
          if (match) {
            mentionedItems.push(match[1]);
          }
        }
      }
    }

    return [...new Set(mentionedItems)]; // Remove duplicates
  }

  /**
   * Enhance product recommendations with AI reasoning
   */
  private static async enhanceWithAIReasoning(
    products: any[],
    context: GiftContext
  ): Promise<GiftRecommendation[]> {
    return products.map(product => {
      const matchReasons = this.generateMatchReasons(product, context);
      const matchScore = this.calculateMatchScore(product, context, matchReasons);
      const explanation = this.generateExplanation(product, context, matchReasons);

      return {
        productId: product.productId || product.id,
        title: product.title || product.name,
        price: product.price,
        imageUrl: product.imageUrl || product.image,
        vendor: product.vendor || product.brand || 'Unknown',
        purchaseUrl: product.purchaseUrl || product.url || '#',
        matchScore,
        explanation,
        matchReasons
      };
    });
  }

  /**
   * Generate reasons why a product matches the gift context
   */
  private static generateMatchReasons(product: any, context: GiftContext): string[] {
    const reasons: string[] = [];
    const productTitle = (product.title || product.name || '').toLowerCase();
    const productDesc = (product.description || '').toLowerCase();

    // Budget matching
    if (context.budget && product.price >= context.budget[0] && product.price <= context.budget[1]) {
      reasons.push('Perfect for your budget');
    }

    // Interest matching
    if (context.interests) {
      for (const interest of context.interests) {
        if (productTitle.includes(interest.toLowerCase()) || productDesc.includes(interest.toLowerCase())) {
          reasons.push(`Matches ${interest} interest`);
        }
      }
    }

    // Occasion matching
    if (context.occasion) {
      const occasion = context.occasion.toLowerCase();
      if (occasion.includes('birthday') && (productTitle.includes('gift') || productTitle.includes('present'))) {
        reasons.push('Great birthday gift');
      } else if (occasion.includes('anniversary') && (productTitle.includes('romantic') || productTitle.includes('elegant'))) {
        reasons.push('Perfect for anniversary');
      }
    }

    // Quality indicators
    if (product.rating && product.rating >= 4.0) {
      reasons.push('Highly rated product');
    }

    if (reasons.length === 0) {
      reasons.push('Popular choice');
    }

    return reasons;
  }

  /**
   * Calculate match score for a product
   */
  private static calculateMatchScore(product: any, context: GiftContext, matchReasons: string[]): number {
    let score = 0.5; // Base score

    // Budget bonus
    if (context.budget && product.price >= context.budget[0] && product.price <= context.budget[1]) {
      score += 0.3;
    }

    // Interest matching bonus
    if (context.interests) {
      const matchingInterests = context.interests.filter(interest =>
        (product.title || '').toLowerCase().includes(interest.toLowerCase())
      );
      score += matchingInterests.length * 0.15;
    }

    // Match reasons bonus
    score += matchReasons.length * 0.05;

    // Rating bonus
    if (product.rating) {
      score += (product.rating - 3) * 0.1; // Bonus for ratings above 3
    }

    return Math.min(1.0, Math.max(0.0, score)); // Clamp between 0 and 1
  }

  /**
   * Generate explanation for why this product is recommended
   */
  private static generateExplanation(product: any, context: GiftContext, matchReasons: string[]): string {
    const recipient = context.recipient || 'them';
    const occasion = context.occasion || 'this occasion';
    
    if (matchReasons.length > 0) {
      return `Perfect for ${recipient}'s ${occasion}. ${matchReasons[0]} and it's highly rated by other customers.`;
    }
    
    return `This would make a thoughtful gift for ${recipient}'s ${occasion}.`;
  }

  /**
   * Score and rank recommendations by relevance
   */
  private static scoreAndRankRecommendations(
    recommendations: GiftRecommendation[],
    context: GiftContext
  ): GiftRecommendation[] {
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .map((rec, index) => ({
        ...rec,
        matchScore: Math.round(rec.matchScore * 100) / 100 // Round to 2 decimal places
      }));
  }

  /**
   * Calculate overall confidence in recommendations
   */
  private static calculateConfidence(context: GiftContext, recommendations: GiftRecommendation[]): number {
    let confidence = 0.5; // Base confidence

    // More context = higher confidence
    if (context.recipient) confidence += 0.1;
    if (context.occasion) confidence += 0.15;
    if (context.interests && context.interests.length > 0) confidence += 0.1;
    if (context.budget) confidence += 0.1;
    if (context.relationship) confidence += 0.05;

    // Quality of recommendations
    if (recommendations.length > 0) {
      const avgScore = recommendations.reduce((sum, rec) => sum + rec.matchScore, 0) / recommendations.length;
      confidence += avgScore * 0.1;
    }

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * Generate reasoning explanation for the recommendations
   */
  private static generateRecommendationReasoning(
    context: GiftContext,
    recommendations: GiftRecommendation[]
  ): string {
    const parts: string[] = [];

    if (context.occasion && context.recipient) {
      parts.push(`Based on ${context.recipient}'s ${context.occasion}`);
    }

    if (context.interests && context.interests.length > 0) {
      parts.push(`considering their interests in ${context.interests.slice(0, 2).join(' and ')}`);
    }

    if (context.budget) {
      parts.push(`within your $${context.budget[0]}-$${context.budget[1]} budget`);
    }

    if (recommendations.length > 0) {
      const topScore = recommendations[0].matchScore;
      if (topScore > 0.8) {
        parts.push('with excellent matches found');
      } else if (topScore > 0.6) {
        parts.push('with good matches found');
      }
    }

    return parts.length > 0 ? parts.join(', ') + '.' : 'Here are some thoughtful gift suggestions.';
  }
}