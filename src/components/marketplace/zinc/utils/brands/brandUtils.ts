
/**
 * Extract a likely brand from a product title
 */
export function getBrandFromTitle(title: string): string {
  const commonBrands = [
    'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Microsoft', 'Dell', 'HP', 
    'LG', 'Bose', 'Sonos', 'Amazon', 'Google', 'Logitech', 'Levi\'s', 'Nintendo'
  ];
  
  for (const brand of commonBrands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // Return the first word of the title as a fallback
  return title.split(' ')[0];
}
