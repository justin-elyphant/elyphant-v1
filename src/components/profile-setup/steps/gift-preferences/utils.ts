
import { GiftPreference } from "@/types/supabase";

// Convert importance string to number value used in the API
export function importanceToValue(importance: "low" | "medium" | "high"): number {
  switch (importance) {
    case "low": return 1;
    case "medium": return 3;
    case "high": return 5;
    default: return 3;
  }
}

// Convert importance number from API to string 
export function valueToImportance(value: number): "low" | "medium" | "high" {
  if (value <= 1) return "low";
  if (value >= 4) return "high";
  return "medium"; 
}

// Create a new gift preference object
export function createGiftPreference(
  category: string, 
  importance: "low" | "medium" | "high"
): GiftPreference {
  return {
    category: category.trim(),
    importance: importanceToValue(importance)
  };
}

// Format gift preferences for display
export function formatGiftPreferences(
  preferences: GiftPreference[]
): Array<{ category: string, importance: "low" | "medium" | "high" }> {
  return preferences.map(pref => ({
    category: pref.category,
    importance: valueToImportance(pref.importance)
  }));
}
