
import { GiftPreference } from "@/types/supabase";

/**
 * Creates a new gift preference object with the given category and importance level
 */
export function createGiftPreference(
  category: string,
  importance: "low" | "medium" | "high"
): GiftPreference {
  // Convert string importance levels to numeric values
  const importanceMap = {
    low: 1,
    medium: 2,
    high: 3
  };
  
  return {
    category: category.trim(),
    importance: importanceMap[importance] || 2,
    subcategory: "",
    notes: ""
  };
}

/**
 * Converts a numeric importance to its string representation
 */
export function getImportanceLabel(importance: number): "low" | "medium" | "high" {
  if (importance <= 1) return "low";
  if (importance >= 3) return "high";
  return "medium";
}
