
export type CategoryImportance = 'low' | 'medium' | 'high';

export function valueToImportance(value: number): CategoryImportance {
  if (value <= 33) return 'low';
  if (value <= 66) return 'medium';
  return 'high';
}

export function importanceToValue(importance: CategoryImportance): number {
  switch (importance) {
    case 'low': return 33;
    case 'medium': return 66;
    case 'high': return 100;
    default: return 66;
  }
}

export const getSuggestedCategories = (): string[] => [
  "Books",
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports & Outdoors",
  "Beauty & Personal Care",
  "Toys & Games",
  "Health & Wellness",
  "Art & Crafts",
  "Food & Beverages"
];
