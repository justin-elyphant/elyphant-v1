
// Helper functions for gift preferences

import { GiftPreference } from "@/types/supabase";

// Convert string importance level to number
export function importanceToNumber(importance: 'low' | 'medium' | 'high'): number {
  switch (importance) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    default: return 2;
  }
}

// Convert number importance back to string level
export function numberToImportance(importance: number): 'low' | 'medium' | 'high' {
  switch (importance) {
    case 1: return 'low';
    case 2: return 'medium';
    case 3: return 'high';
    default: return 'medium';
  }
}

// Create a valid GiftPreference object
export function createGiftPreference(category: string, importance: 'low' | 'medium' | 'high'): GiftPreference {
  return {
    category,
    importance: importanceToNumber(importance)
  };
}
