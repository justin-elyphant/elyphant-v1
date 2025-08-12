/**
 * TagIntelligenceService - Enhanced tag management with AI-powered suggestions
 * Provides smart tag recommendations, categorization, and Nicole AI integration
 */

// Predefined tag categories for intelligent suggestions
export const TAG_CATEGORIES = {
  occasions: [
    'birthday', 'anniversary', 'wedding', 'graduation', 'holiday',
    'christmas', 'valentines', 'mothers-day', 'fathers-day', 'thanksgiving'
  ],
  priceRanges: [
    'under-25', '25-50', '50-100', '100-200', '200-500', 'luxury'
  ],
  interests: [
    'tech', 'fitness', 'cooking', 'reading', 'gaming', 'music',
    'art', 'travel', 'fashion', 'home-decor', 'outdoor', 'crafts'
  ],
  urgency: [
    'urgent', 'soon', 'this-month', 'future', 'no-rush'
  ],
  relationships: [
    'family', 'friends', 'colleagues', 'partner', 'kids', 'parents'
  ],
  style: [
    'minimalist', 'vintage', 'modern', 'classic', 'trendy', 'unique'
  ]
};

// Seasonal and trending tags
export const SEASONAL_TAGS = {
  spring: ['spring-cleaning', 'easter', 'mothers-day', 'graduation'],
  summer: ['vacation', 'outdoor', 'bbq', 'wedding-season'],
  fall: ['back-to-school', 'halloween', 'thanksgiving', 'cozy'],
  winter: ['christmas', 'new-year', 'holiday', 'winter-sports']
};

export interface TagSuggestion {
  tag: string;
  category: string;
  confidence: number;
  reason: string;
}

export interface TagAnalytics {
  popularTags: { tag: string; usage: number }[];
  trendingTags: { tag: string; growth: number }[];
  userPatterns: { category: string; frequency: number }[];
}

class TagIntelligenceService {
  /**
   * Generate smart tag suggestions based on wishlist context
   */
  generateTagSuggestions(
    title: string,
    description?: string,
    category?: string,
    existingTags: string[] = []
  ): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];
    const text = `${title} ${description || ''}`.toLowerCase();
    
    // Analyze title and description for relevant tags
    Object.entries(TAG_CATEGORIES).forEach(([categoryName, tags]) => {
      tags.forEach(tag => {
        if (existingTags.includes(tag)) return;
        
        const confidence = this.calculateTagConfidence(text, tag);
        if (confidence > 0.3) {
          suggestions.push({
            tag,
            category: categoryName,
            confidence,
            reason: this.generateTagReason(text, tag, categoryName)
          });
        }
      });
    });
    
    // Add seasonal suggestions
    const season = this.getCurrentSeason();
    SEASONAL_TAGS[season]?.forEach(tag => {
      if (!existingTags.includes(tag)) {
        suggestions.push({
          tag,
          category: 'seasonal',
          confidence: 0.6,
          reason: `Suggested for ${season} season`
        });
      }
    });
    
    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);
  }
  
  /**
   * Auto-generate tags from product data using AI analysis
   */
  autoTagFromProduct(product: any): string[] {
    const autoTags: string[] = [];
    
    // Price-based tags
    if (product.price) {
      if (product.price < 25) autoTags.push('under-25');
      else if (product.price < 50) autoTags.push('25-50');
      else if (product.price < 100) autoTags.push('50-100');
      else if (product.price < 200) autoTags.push('100-200');
      else if (product.price < 500) autoTags.push('200-500');
      else autoTags.push('luxury');
    }
    
    // Category-based tags from product title/description
    const text = `${product.title || ''} ${product.description || ''}`.toLowerCase();
    
    // Tech products
    if (text.includes('phone') || text.includes('laptop') || text.includes('gadget')) {
      autoTags.push('tech');
    }
    
    // Fashion items
    if (text.includes('clothing') || text.includes('jewelry') || text.includes('accessories')) {
      autoTags.push('fashion');
    }
    
    // Home items
    if (text.includes('home') || text.includes('kitchen') || text.includes('decor')) {
      autoTags.push('home-decor');
    }
    
    return autoTags;
  }
  
  /**
   * Get contextual tag recommendations for Nicole AI
   */
  getContextualTagsForNicole(
    recipientProfile?: any,
    occasion?: string,
    relationship?: string
  ): string[] {
    const contextTags: string[] = [];
    
    // Occasion-based tags
    if (occasion) {
      const occasionTags = TAG_CATEGORIES.occasions.filter(tag => 
        tag.includes(occasion.toLowerCase()) || occasion.toLowerCase().includes(tag)
      );
      contextTags.push(...occasionTags);
    }
    
    // Relationship-based tags
    if (relationship) {
      const relationshipTags = TAG_CATEGORIES.relationships.filter(tag =>
        tag.includes(relationship.toLowerCase()) || relationship.toLowerCase().includes(tag)
      );
      contextTags.push(...relationshipTags);
    }
    
    // Profile-based tags from interests
    if (recipientProfile?.interests) {
      recipientProfile.interests.forEach((interest: string) => {
        const matchingTags = Object.values(TAG_CATEGORIES)
          .flat()
          .filter(tag => tag.includes(interest.toLowerCase()) || interest.toLowerCase().includes(tag));
        contextTags.push(...matchingTags);
      });
    }
    
    return [...new Set(contextTags)]; // Remove duplicates
  }
  
  /**
   * Analyze user tag patterns for insights
   */
  analyzeUserTagPatterns(userWishlists: any[]): TagAnalytics {
    const tagUsage = new Map<string, number>();
    const categoryUsage = new Map<string, number>();
    
    userWishlists.forEach(wishlist => {
      wishlist.tags?.forEach((tag: string) => {
        tagUsage.set(tag, (tagUsage.get(tag) || 0) + 1);
        
        // Find category for this tag
        const category = Object.entries(TAG_CATEGORIES).find(([_, tags]) => 
          tags.includes(tag)
        )?.[0] || 'custom';
        
        categoryUsage.set(category, (categoryUsage.get(category) || 0) + 1);
      });
    });
    
    const popularTags = Array.from(tagUsage.entries())
      .map(([tag, usage]) => ({ tag, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
    
    const userPatterns = Array.from(categoryUsage.entries())
      .map(([category, frequency]) => ({ category, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
    
    return {
      popularTags,
      trendingTags: [], // Could be populated with time-based analysis
      userPatterns
    };
  }
  
  /**
   * Filter tags by category for better organization
   */
  filterTagsByCategory(tags: string[], category: keyof typeof TAG_CATEGORIES): string[] {
    const categoryTags = TAG_CATEGORIES[category];
    return tags.filter(tag => categoryTags.includes(tag));
  }
  
  /**
   * Get all available tags organized by category
   */
  getAllTagsByCategory(): typeof TAG_CATEGORIES {
    return TAG_CATEGORIES;
  }
  
  /**
   * Calculate confidence score for tag suggestion
   */
  private calculateTagConfidence(text: string, tag: string): number {
    let confidence = 0;
    
    // Direct word match
    if (text.includes(tag)) confidence += 0.8;
    
    // Partial match
    const tagWords = tag.split('-');
    const matchingWords = tagWords.filter(word => text.includes(word));
    confidence += (matchingWords.length / tagWords.length) * 0.5;
    
    // Semantic matching (simplified)
    const synonyms: Record<string, string[]> = {
      'tech': ['technology', 'digital', 'electronic', 'smart'],
      'fitness': ['workout', 'exercise', 'gym', 'health'],
      'cooking': ['kitchen', 'food', 'recipe', 'chef']
    };
    
    if (synonyms[tag]) {
      const synonymMatches = synonyms[tag].filter(synonym => text.includes(synonym));
      confidence += synonymMatches.length * 0.3;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Generate reason for tag suggestion
   */
  private generateTagReason(text: string, tag: string, category: string): string {
    if (text.includes(tag)) {
      return `Direct match found in text`;
    }
    
    const tagWords = tag.split('-');
    const matchingWords = tagWords.filter(word => text.includes(word));
    if (matchingWords.length > 0) {
      return `Related to: ${matchingWords.join(', ')}`;
    }
    
    return `Suggested based on ${category} category`;
  }
  
  /**
   * Get current season for seasonal suggestions
   */
  private getCurrentSeason(): keyof typeof SEASONAL_TAGS {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}

export const tagIntelligenceService = new TagIntelligenceService();