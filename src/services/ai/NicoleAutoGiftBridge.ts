/**
 * Bridge service for passing context from Nicole conversations to UnifiedGiftSchedulingModal
 * Transforms Nicole's conversational context into the format expected by the recurring gift modal
 */

interface NicoleAutoGiftContext {
  recipientName?: string;
  occasion?: string;
  budgetRange?: [number, number];
  relationshipType?: string;
  recipientId?: string;
}

interface AutoGiftSetupData {
  recipientName?: string;
  occasionType?: string;
  budget?: {
    min: number;
    max: number;
  };
  relationshipType?: string;
  recipientId?: string;
  eventType?: string;
  giftMessage?: string;
}

export class NicoleAutoGiftBridge {
  /**
   * Transform Nicole's conversational context to UnifiedGiftSchedulingModal initial data
   */
  static transformContext(nicoleContext: NicoleAutoGiftContext): AutoGiftSetupData {
    const setupData: AutoGiftSetupData = {};

    if (nicoleContext.recipientName) {
      setupData.recipientName = nicoleContext.recipientName;
    }

    if (nicoleContext.occasion) {
      setupData.occasionType = nicoleContext.occasion;
      setupData.eventType = this.mapOccasionToEventType(nicoleContext.occasion);
    }

    if (nicoleContext.budgetRange) {
      setupData.budget = {
        min: nicoleContext.budgetRange[0],
        max: nicoleContext.budgetRange[1]
      };
    }

    if (nicoleContext.relationshipType) {
      setupData.relationshipType = nicoleContext.relationshipType;
    }

    if (nicoleContext.recipientId) {
      setupData.recipientId = nicoleContext.recipientId;
    }

    // Add default gift message based on context
    if (nicoleContext.recipientName && nicoleContext.occasion) {
      setupData.giftMessage = `Happy ${nicoleContext.occasion}! Hope you love this gift!`;
    }

    return setupData;
  }

  /**
   * Map Nicole's occasion strings to recurring gift event types
   */
  private static mapOccasionToEventType(occasion: string): string {
    const occasionLower = occasion.toLowerCase();

    if (occasionLower.includes('birthday')) return 'birthday';
    if (occasionLower.includes('anniversary')) return 'anniversary';
    if (occasionLower.includes('christmas')) return 'christmas';
    if (occasionLower.includes('valentine')) return 'valentines_day';
    if (occasionLower.includes('mother')) return 'mothers_day';
    if (occasionLower.includes('father')) return 'fathers_day';
    if (occasionLower.includes('graduation')) return 'graduation';
    if (occasionLower.includes('wedding')) return 'wedding';
    if (occasionLower.includes('holiday')) return 'holiday';

    return 'custom'; // Default for unrecognized occasions
  }

  /**
   * Generate suggested budget ranges based on occasion and relationship
   */
  static suggestBudgetRange(occasion?: string, relationship?: string): [number, number] {
    const occasionLower = occasion?.toLowerCase() || '';
    const relationshipLower = relationship?.toLowerCase() || '';

    // Close relationships get higher budget suggestions
    const isCloseRelationship = ['spouse', 'partner', 'parent', 'child', 'best friend'].some(rel => 
      relationshipLower.includes(rel)
    );

    // Special occasions get higher budget suggestions
    const isSpecialOccasion = ['anniversary', 'wedding', 'graduation', 'birthday'].some(occ =>
      occasionLower.includes(occ)
    );

    if (isCloseRelationship && isSpecialOccasion) {
      return [75, 200]; // Higher range for close + special
    } else if (isCloseRelationship || isSpecialOccasion) {
      return [50, 150]; // Medium range
    } else {
      return [25, 75]; // Standard range
    }
  }

  /**
   * Extract recipient and relationship from Nicole's conversation context
   */
  static extractRecipientInfo(conversationHistory: Array<{ role: string; content: string }>) {
    let recipientName: string | undefined;
    let relationship: string | undefined;

    // Look through conversation for recipient mentions
    for (const message of conversationHistory) {
      if (message.role === 'user') {
        const content = message.content.toLowerCase();
        
        // Extract relationship patterns
        const relationshipPatterns = [
          /for my (\w+)/,
          /my (\w+)'s/,
          /(\w+) is my/,
          /gift for my (\w+)/
        ];

        for (const pattern of relationshipPatterns) {
          const match = content.match(pattern);
          if (match) {
            relationship = match[1];
            break;
          }
        }

        // Extract recipient name patterns
        const namePatterns = [
          /for ([A-Z][a-z]+)/,
          /([A-Z][a-z]+)'s \w+/,
          /give to ([A-Z][a-z]+)/
        ];

        for (const pattern of namePatterns) {
          const match = message.content.match(pattern);
          if (match) {
            recipientName = match[1];
            break;
          }
        }
      }
    }

    return { recipientName, relationship };
  }
}