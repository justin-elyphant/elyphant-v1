
import { GiftPreference } from '@/types/profile';

/**
 * Define all available gift categories
 */
export const CATEGORIES = [
  'Books',
  'Electronics',
  'Fashion',
  'Home Decor',
  'Kitchen',
  'Sports',
  'Outdoors',
  'Beauty',
  'Jewelry',
  'Travel',
  'Music',
  'Games',
  'Movies',
  'Arts & Crafts',
  'Toys',
  'Food & Drink',
  'Fitness',
  'Garden',
  'Health',
  'Tech Gadgets'
];

/**
 * Get a list of suggested categories based on user preferences
 */
export const getSuggestedCategories = (): string[] => {
  return CATEGORIES.slice(0, 10); // Return first 10 categories
};

/**
 * Normalize gift preferences to ensure consistent format
 */
export const normalizeGiftPreferences = (preferences: any[]): GiftPreference[] => {
  if (!preferences || !Array.isArray(preferences)) {
    return [];
  }
  
  return preferences.map(pref => {
    if (typeof pref === 'string') {
      return { category: pref, importance: 'medium' };
    }
    
    // Ensure importance is one of the allowed values
    let importance = pref.importance || 'medium';
    if (!['low', 'medium', 'high'].includes(importance)) {
      importance = 'medium';
    }
    
    return {
      category: pref.category || '',
      importance: importance as 'low' | 'medium' | 'high'
    };
  });
};

/**
 * Convert string array to gift preference format
 */
export const categoriesToGiftPreferences = (categories: string[]): GiftPreference[] => {
  return categories.map(category => ({
    category,
    importance: 'medium'
  }));
};

export default {
  CATEGORIES,
  getSuggestedCategories,
  normalizeGiftPreferences,
  categoriesToGiftPreferences
};
