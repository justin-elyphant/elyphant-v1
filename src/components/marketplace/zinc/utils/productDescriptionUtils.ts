
/**
 * Get a relevant suffix for product titles
 */
export function getSuffix(category: string, index: number): string {
  const suffixes: Record<string, string[]> = {
    'Footwear': ['Athletic Shoes', 'Casual Sneakers', 'Running Shoes', 'Walking Shoes', 'Comfort Fit'],
    'Clothing': ['T-Shirt', 'Jacket', 'Hoodie', 'Sweatshirt', 'Premium Apparel'],
    'Electronics': ['Smartphone', 'Accessory', 'Charger', 'Case', 'Screen Protector'],
    'Gaming': ['Controller', 'Game', 'Accessory', 'Headset', 'Console'],
    'Sports': ['Jersey', 'Fan Gear', 'Collectible', 'Team Hat', 'Memorabilia'],
    'Books': ['Bestseller', 'Paperback', 'Hardcover', 'Illustrated Edition', 'Collector Edition'],
    'Tools': ['Pro Kit', 'DIY Set', 'Premium Tool', 'Workshop Essential', 'Contractor Grade'],
    'Kitchen': ['Appliance', 'Cookware', 'Set', 'Premium Edition', 'Professional'],
    'Toys': ['Playset', 'Collection', 'Interactive', 'Educational', 'Limited Edition']
  };
  
  const defaultSuffixes = ['Essential', 'Premium', 'Professional', 'Standard', 'Deluxe'];
  const categorySpecificSuffixes = suffixes[category] || defaultSuffixes;
  
  return categorySpecificSuffixes[index % categorySpecificSuffixes.length];
}

/**
 * Get a relevant use case based on category
 */
export function getUseCase(category: string): string {
  switch (category) {
    case 'Footwear': return 'everyday wear, sports, and casual outings';
    case 'Clothing': return 'casual and formal occasions';
    case 'Electronics': return 'work, entertainment, and staying connected';
    case 'Gaming': return 'gaming enthusiasts and casual players';
    case 'Sports': return 'fans and sports enthusiasts';
    case 'Books': return 'reading enthusiasts and collectors';
    case 'Tools': return 'DIY projects and professional work';
    case 'Kitchen': return 'cooking enthusiasts and professional chefs';
    case 'Toys': return 'children and collectors';
    default: return 'daily use and special occasions';
  }
}
