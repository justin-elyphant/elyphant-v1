import { Database } from "@/integrations/supabase/types";

export interface GiftSelectionCriteria {
  relationshipType: string;
  budgetLimit: number;
  giftCategories: string[];
  recipientBirthYear?: number;
  dateType: string; // birthday, anniversary, etc.
  excludeItems?: string[];
}

export interface GiftRecommendation {
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  confidence: number; // 0-1 score
  reasoning: string;
  category: string;
  ageAppropriate: boolean;
}

type RelationshipBudgetMultiplier = {
  [key: string]: number;
};

// Relationship-based budget multipliers
const RELATIONSHIP_MULTIPLIERS: RelationshipBudgetMultiplier = {
  spouse: 1.5,
  family: 1.2,
  close_friend: 1.1,
  friend: 1.0,
  colleague: 0.8,
  acquaintance: 0.7
};

// Age-appropriate gift categories
const AGE_CATEGORIES = {
  teen: ['Electronics', 'Sports & Outdoors', 'Books & Reading', 'Arts & Crafts'],
  youngAdult: ['Electronics', 'Fashion & Accessories', 'Sports & Outdoors', 'Travel & Experiences'],
  adult: ['Home & Kitchen', 'Health & Beauty', 'Books & Reading', 'Electronics', 'Jewelry & Watches'],
  middleAge: ['Home & Kitchen', 'Health & Beauty', 'Books & Reading', 'Travel & Experiences'],
  senior: ['Books & Reading', 'Health & Beauty', 'Home & Kitchen', 'Music & Entertainment']
};

// Default categories by relationship
const RELATIONSHIP_CATEGORIES = {
  spouse: ['Jewelry & Watches', 'Fashion & Accessories', 'Health & Beauty', 'Travel & Experiences'],
  family: ['Home & Kitchen', 'Books & Reading', 'Electronics', 'Health & Beauty'],
  close_friend: ['Fashion & Accessories', 'Electronics', 'Sports & Outdoors', 'Entertainment'],
  friend: ['Books & Reading', 'Food & Beverages', 'Electronics', 'Arts & Crafts'],
  colleague: ['Books & Reading', 'Food & Beverages', 'Electronics'],
  acquaintance: ['Books & Reading', 'Food & Beverages']
};

export class GiftSelectionService {
  /**
   * Calculate relationship-adjusted budget
   */
  static calculateAdjustedBudget(baseBudget: number, relationshipType: string): number {
    const multiplier = RELATIONSHIP_MULTIPLIERS[relationshipType] || 1.0;
    return Math.round(baseBudget * multiplier);
  }

  /**
   * Get age category based on birth year
   */
  static getAgeCategory(birthYear?: number): string {
    if (!birthYear) return 'adult';
    
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    
    if (age < 18) return 'teen';
    if (age < 30) return 'youngAdult';
    if (age < 50) return 'adult';
    if (age < 65) return 'middleAge';
    return 'senior';
  }

  /**
   * Get age-appropriate search terms
   */
  static getAgeAppropriateSearchTerms(birthYear?: number, dateType: string = 'birthday'): string[] {
    const ageCategory = this.getAgeCategory(birthYear);
    const baseTerms: string[] = [];
    
    // Add age-specific terms
    if (birthYear) {
      const age = new Date().getFullYear() - birthYear;
      
      if (age < 18) {
        baseTerms.push('teen', 'youth', 'student');
      } else if (age < 30) {
        baseTerms.push('young adult', 'millennial', 'trendy');
      } else if (age < 50) {
        baseTerms.push('professional', 'adult', 'quality');
      } else if (age < 65) {
        baseTerms.push('mature', 'sophisticated', 'premium');
      } else {
        baseTerms.push('senior', 'classic', 'comfort');
      }
    }
    
    // Add occasion-specific terms
    if (dateType === 'birthday') {
      baseTerms.push('birthday gift', 'special occasion');
    } else if (dateType === 'anniversary') {
      baseTerms.push('anniversary gift', 'romantic', 'meaningful');
    } else if (dateType === 'christmas') {
      baseTerms.push('holiday gift', 'Christmas present');
    }
    
    return baseTerms;
  }

  /**
   * Get recommended categories based on relationship and age
   */
  static getRecommendedCategories(
    relationshipType: string, 
    birthYear?: number, 
    selectedCategories: string[] = []
  ): string[] {
    // If user has selected categories, prioritize those
    if (selectedCategories.length > 0) {
      return selectedCategories;
    }
    
    // Get relationship-based categories
    const relationshipCategories = RELATIONSHIP_CATEGORIES[relationshipType] || RELATIONSHIP_CATEGORIES.friend;
    
    // Get age-appropriate categories
    const ageCategory = this.getAgeCategory(birthYear);
    const ageCategories = AGE_CATEGORIES[ageCategory] || AGE_CATEGORIES.adult;
    
    // Combine and prioritize categories that appear in both lists
    const combinedCategories = [
      ...relationshipCategories,
      ...ageCategories.filter(cat => !relationshipCategories.includes(cat))
    ];
    
    return combinedCategories.slice(0, 6); // Return top 6 categories
  }

  /**
   * Generate gift selection criteria based on wizard data
   */
  static generateSelectionCriteria(
    relationshipType: string,
    budgetLimit: number,
    selectedCategories: string[],
    recipientBirthYear?: number,
    dateType: string = 'birthday'
  ): GiftSelectionCriteria {
    const adjustedBudget = this.calculateAdjustedBudget(budgetLimit, relationshipType);
    const recommendedCategories = this.getRecommendedCategories(
      relationshipType, 
      recipientBirthYear, 
      selectedCategories
    );
    
    return {
      relationshipType,
      budgetLimit: adjustedBudget,
      giftCategories: recommendedCategories,
      recipientBirthYear,
      dateType,
      excludeItems: []
    };
  }

  /**
   * Create search query for AI gift search
   */
  static createSearchQuery(criteria: GiftSelectionCriteria): string {
    const { relationshipType, budgetLimit, giftCategories, recipientBirthYear, dateType } = criteria;
    
    const ageTerms = this.getAgeAppropriateSearchTerms(recipientBirthYear, dateType);
    const categoryText = giftCategories.length > 0 
      ? `in categories: ${giftCategories.join(', ')}` 
      : '';
    
    const relationshipText = relationshipType === 'spouse' 
      ? 'romantic partner' 
      : relationshipType.replace('_', ' ');
    
    const occasionText = dateType === 'birthday' 
      ? 'birthday' 
      : dateType.replace('_', ' ');
    
    return `Find a thoughtful ${occasionText} gift for my ${relationshipText} ${categoryText}. Budget: $${budgetLimit}. ${ageTerms.join(', ')}.`;
  }

  /**
   * Score gift recommendations based on criteria
   */
  static scoreGiftRecommendation(
    product: any, 
    criteria: GiftSelectionCriteria
  ): number {
    let score = 0.5; // Base score
    
    // Budget appropriateness (0.3 weight)
    const priceRatio = product.price / criteria.budgetLimit;
    if (priceRatio <= 0.8) {
      score += 0.3; // Good value
    } else if (priceRatio <= 1.0) {
      score += 0.2; // Within budget
    } else if (priceRatio <= 1.2) {
      score += 0.1; // Slightly over budget
    }
    
    // Category match (0.3 weight)
    if (criteria.giftCategories.some(cat => 
      product.category?.toLowerCase().includes(cat.toLowerCase()) ||
      product.name?.toLowerCase().includes(cat.toLowerCase())
    )) {
      score += 0.3;
    }
    
    // Age appropriateness (0.2 weight)
    if (criteria.recipientBirthYear) {
      const ageCategory = this.getAgeCategory(criteria.recipientBirthYear);
      const appropriateCategories = AGE_CATEGORIES[ageCategory] || [];
      
      if (appropriateCategories.some(cat => 
        product.category?.toLowerCase().includes(cat.toLowerCase())
      )) {
        score += 0.2;
      }
    }
    
    // Relationship appropriateness (0.2 weight)
    const relationshipCategories = RELATIONSHIP_CATEGORIES[criteria.relationshipType] || [];
    if (relationshipCategories.some(cat => 
      product.category?.toLowerCase().includes(cat.toLowerCase())
    )) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Filter out inappropriate items
   */
  static filterInappropriateItems(
    products: any[], 
    criteria: GiftSelectionCriteria
  ): any[] {
    const inappropriateKeywords = ['adult', 'explicit', 'inappropriate'];
    
    return products.filter(product => {
      // Filter by budget (with 20% tolerance)
      if (product.price > criteria.budgetLimit * 1.2) {
        return false;
      }
      
      // Filter inappropriate content
      const productText = `${product.name} ${product.description || ''} ${product.category || ''}`.toLowerCase();
      if (inappropriateKeywords.some(keyword => productText.includes(keyword))) {
        return false;
      }
      
      // Filter excluded items
      if (criteria.excludeItems && criteria.excludeItems.length > 0) {
        if (criteria.excludeItems.some(excluded => 
          productText.includes(excluded.toLowerCase())
        )) {
          return false;
        }
      }
      
      return true;
    });
  }
}