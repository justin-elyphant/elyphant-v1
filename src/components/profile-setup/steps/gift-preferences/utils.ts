
export type CategoryImportance = 'low' | 'medium' | 'high';

// Predefined categories for users to choose from
export const CATEGORIES: string[] = [
  'Books',
  'Electronics',
  'Clothing',
  'Home Decor',
  'Kitchen',
  'Gaming',
  'Outdoors',
  'Sports',
  'Music',
  'Art',
  'Beauty',
  'Jewelry',
  'Fitness',
  'Travel',
  'Food & Beverage',
  'Pets',
  'Office Supplies',
  'DIY & Crafts',
  'Gardening',
  'Tech Gadgets'
];

// Get suggested categories based on popularity or personalization
export const getSuggestedCategories = (): string[] => {
  // For now, return a subset of popular categories
  return [
    'Electronics',
    'Books',
    'Clothing',
    'Home Decor',
    'Kitchen',
    'Beauty',
    'Tech Gadgets',
    'Food & Beverage'
  ];
};
