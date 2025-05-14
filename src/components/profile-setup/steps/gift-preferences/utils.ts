
// Define types for gift preferences
export type CategoryImportance = "low" | "medium" | "high";

// Map numeric values to importance levels
export function valueToImportance(value: number): CategoryImportance {
  if (value <= 33) return "low";
  if (value <= 66) return "medium";
  return "high";
}

// Map importance levels to numeric values
export function importanceToValue(importance: CategoryImportance): number {
  switch (importance) {
    case "low":
      return 33;
    case "medium":
      return 66;
    case "high":
      return 100;
    default:
      return 66; // default to medium
  }
}

// Predefined gift preference categories
export const giftCategories = [
  "Books",
  "Electronics",
  "Fashion",
  "Home Decor",
  "Kitchen",
  "Music",
  "Sports",
  "Beauty",
  "Outdoors",
  "Toys",
  "Games",
  "Art",
  "Jewelry",
  "Travel",
  "Food & Drink",
  "Pets",
  "Fitness",
  "DIY",
  "Garden",
  "Technology"
];

// Find suggested categories based on a search term
export function getSuggestedCategories(searchTerm: string): string[] {
  if (!searchTerm) return giftCategories.slice(0, 6);
  
  const normalizedSearch = searchTerm.toLowerCase();
  return giftCategories
    .filter(cat => cat.toLowerCase().includes(normalizedSearch))
    .slice(0, 10);
}
