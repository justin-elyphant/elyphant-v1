
import { GiftPreference } from "@/types/profile";

export type CategoryImportance = 'low' | 'medium' | 'high';

/**
 * Convert numeric value to importance level
 */
export const valueToImportance = (value: number): CategoryImportance => {
  if (value <= 1) return 'low';
  if (value <= 2) return 'medium';
  return 'high';
};

/**
 * Convert importance level to numeric value
 */
export const importanceToValue = (importance: CategoryImportance): number => {
  switch (importance) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    default: return 2;
  }
};

/**
 * Create a new gift preference
 */
export const createGiftPreference = (
  category: string, 
  importance: CategoryImportance = 'medium',
  notes: string = ''
): GiftPreference => {
  return {
    category,
    importance: importanceToValue(importance),
    notes
  };
};

/**
 * Get default gift preferences
 */
export const getDefaultGiftPreferences = (): GiftPreference[] => {
  return [];
};

/**
 * Generate categories list
 */
export const getCategories = (): string[] => {
  return [
    'Books',
    'Electronics',
    'Fashion',
    'Home & Kitchen',
    'Beauty & Personal Care',
    'Sports & Outdoors',
    'Toys & Games',
    'Art & Crafts',
    'Music',
    'Food & Beverage',
    'Travel Experiences',
    'Jewelry',
    'Fitness',
    'Gardening',
    'Tech Gadgets'
  ];
};
