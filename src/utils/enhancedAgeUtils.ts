
/**
 * Age detection and processing utilities
 */

export interface AgeInfo {
  exactAge?: number;
  ageGroup: string;
  ageRange?: string;
  confidence: number;
}

// Age group classifications
export const AGE_GROUPS = {
  baby: { min: 0, max: 1, keywords: ['baby', 'infant', 'newborn'] },
  toddler: { min: 1, max: 3, keywords: ['toddler', 'little one'] },
  child: { min: 4, max: 12, keywords: ['child', 'kid', 'boy', 'girl'] },
  teen: { min: 13, max: 19, keywords: ['teen', 'teenager', 'adolescent'] },
  adult: { min: 20, max: 100, keywords: ['adult', 'grown up'] }
};

/**
 * Extract age information from a message
 */
export function extractAgeFromMessage(message: string): AgeInfo | null {
  const lowerMessage = message.toLowerCase();
  
  // Try to extract exact age first
  const agePatterns = [
    /(\d+)\s*year\s*old/i,
    /(\d+)\s*yr\s*old/i,
    /(\d+)\s*years?\s*old/i,
    /age\s*(\d+)/i,
    /(\d+)\s*year/i
  ];
  
  for (const pattern of agePatterns) {
    const match = message.match(pattern);
    if (match) {
      const age = parseInt(match[1]);
      if (age >= 0 && age <= 100) {
        return {
          exactAge: age,
          ageGroup: getAgeGroupFromAge(age),
          ageRange: getAgeRangeFromAge(age),
          confidence: 1.0
        };
      }
    }
  }
  
  // Try to extract age group keywords
  for (const [groupName, groupInfo] of Object.entries(AGE_GROUPS)) {
    for (const keyword of groupInfo.keywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          ageGroup: groupName,
          ageRange: `${groupInfo.min}-${groupInfo.max} years`,
          confidence: 0.8
        };
      }
    }
  }
  
  return null;
}

/**
 * Get age group from exact age
 */
export function getAgeGroupFromAge(age: number): string {
  for (const [groupName, groupInfo] of Object.entries(AGE_GROUPS)) {
    if (age >= groupInfo.min && age <= groupInfo.max) {
      return groupName;
    }
  }
  return 'adult';
}

/**
 * Get age range description from exact age
 */
export function getAgeRangeFromAge(age: number): string {
  if (age < 1) return 'baby';
  if (age <= 3) return 'toddler';
  if (age <= 12) return 'child';
  if (age <= 19) return 'teenager';
  return 'adult';
}

/**
 * Generate age-appropriate search terms
 */
export function getAgeAppropriateSearchTerms(ageGroup: string): string[] {
  const terms: Record<string, string[]> = {
    baby: ['baby', 'infant', 'newborn', 'safe for babies'],
    toddler: ['toddler', 'safe for toddlers', 'age appropriate', 'educational'],
    child: ['kids', 'children', 'age appropriate', 'educational', 'fun'],
    teen: ['teen', 'teenager', 'young adult', 'trendy'],
    adult: ['adult', 'professional', 'premium', 'sophisticated']
  };
  
  return terms[ageGroup] || [];
}
