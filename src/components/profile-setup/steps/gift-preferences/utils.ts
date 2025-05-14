
import { GiftPreference } from "@/types/profile";

// List of category suggestions
export const categorySuggestions = [
  "Books",
  "Electronics",
  "Fashion",
  "Home Decor",
  "Kitchen Gadgets",
  "Gaming",
  "Sports Equipment",
  "Fitness",
  "Beauty",
  "Skincare",
  "Hobbies",
  "Art Supplies",
  "Plants",
  "Gardening",
  "Travel Accessories",
  "Photography",
  "Music",
  "Outdoor Gear",
  "Jewelry",
  "DIY Tools",
  "Board Games",
  "Collectibles",
  "Stationery",
  "Coffee & Tea",
  "Wine & Spirits",
  "Subscription Boxes",
  "Eco-Friendly Products",
  "Pet Accessories",
  "Smart Home",
  "Wellness"
];

/**
 * Calculate a recommended importance score based on existing preferences
 */
export function getRecommendedImportance(
  category: string,
  existingPreferences: GiftPreference[]
): "low" | "medium" | "high" {
  // If we have a lot of high importance preferences, suggest medium
  const highCount = existingPreferences.filter(p => p.importance === "high").length;
  if (highCount >= 5) {
    return "medium";
  }
  
  // Default to medium
  return "medium";
}

/**
 * Group preferences by importance
 */
export function groupPreferencesByImportance(preferences: GiftPreference[]): {
  high: GiftPreference[];
  medium: GiftPreference[];
  low: GiftPreference[];
} {
  return {
    high: preferences.filter(p => p.importance === "high"),
    medium: preferences.filter(p => p.importance === "medium"),
    low: preferences.filter(p => p.importance === "low")
  };
}
