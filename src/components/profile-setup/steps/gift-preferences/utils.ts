
// Define importance levels
export enum CategoryImportance {
  Low = 0,
  Medium = 1,
  High = 2
}

// Interface for category preferences
export interface CategoryPreference {
  category: string;
  importance: "low" | "medium" | "high";
}

// Function to convert importance string to enum value
export function valueToImportance(value: string | number): CategoryImportance {
  if (typeof value === 'string') {
    switch (value.toLowerCase()) {
      case 'low': return CategoryImportance.Low;
      case 'high': return CategoryImportance.High;
      default: return CategoryImportance.Medium;
    }
  } else if (typeof value === 'number') {
    if (value >= 0 && value <= 2) {
      return value as CategoryImportance;
    }
  }
  return CategoryImportance.Medium;
}

// Function to convert enum value to importance string
export function importanceToValue(importance: CategoryImportance): "low" | "medium" | "high" {
  switch (importance) {
    case CategoryImportance.Low: return "low";
    case CategoryImportance.High: return "high";
    default: return "medium";
  }
}

// Function to get suggested categories based on search term
export function getSuggestedCategories(searchTerm: string): string[] {
  const allCategories = [
    'Books',
    'Electronics',
    'Home & Kitchen',
    'Fashion',
    'Beauty & Personal Care',
    'Toys & Games',
    'Sports & Outdoors',
    'Tools & Home Improvement',
    'Health & Wellness',
    'Art & Crafts',
    'Music',
    'Movies & TV',
    'Food & Drinks',
    'Jewelry',
    'Travel',
    'Experiences',
    'Other'
  ];
  
  if (!searchTerm) return allCategories;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return allCategories.filter(cat => 
    cat.toLowerCase().includes(lowerSearchTerm)
  );
}
