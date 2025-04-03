
/**
 * Generate an exact product image URL based on title and category
 */
export function getExactProductImage(title: string, category: string): string {
  const lowerTitle = title.toLowerCase();
  const lowerCategory = category.toLowerCase();
  
  // Apple Products with exact Amazon images
  if (lowerTitle.includes('macbook') || lowerCategory === 'macbook') {
    return 'https://m.media-amazon.com/images/I/61L5QgPvgqL._AC_SL1500_.jpg';
  }
  
  if (lowerTitle.includes('iphone')) {
    return 'https://m.media-amazon.com/images/I/61bK6PMOC3L._AC_SL1500_.jpg';
  }
  
  if (lowerTitle.includes('ipad')) {
    return 'https://m.media-amazon.com/images/I/81gC7frRJyL._AC_SL1500_.jpg';
  }
  
  if (lowerTitle.includes('airpods')) {
    return 'https://m.media-amazon.com/images/I/71zny7BTRlL._AC_SL1500_.jpg';
  }
  
  if (lowerTitle.includes('apple watch')) {
    return 'https://m.media-amazon.com/images/I/71+3+8VcGFL._AC_SL1500_.jpg';
  }
  
  if (lowerTitle.includes('samsung') && lowerTitle.includes('galaxy')) {
    return 'https://m.media-amazon.com/images/I/61a2y1FCAJL._AC_SL1500_.jpg';
  }
  
  if (lowerTitle.includes('samsung') && lowerTitle.includes('tv')) {
    return 'https://m.media-amazon.com/images/I/91RfzivKmwL._AC_SL1500_.jpg';
  }
  
  if (lowerTitle.includes('playstation') || lowerTitle.includes('ps5')) {
    return 'https://m.media-amazon.com/images/I/51QkER5ynaL._SL1500_.jpg';
  }
  
  if (lowerTitle.includes('xbox')) {
    return 'https://m.media-amazon.com/images/I/61-jjE67aHL._SL1500_.jpg';
  }
  
  if (lowerTitle.includes('nintendo') || lowerTitle.includes('switch')) {
    return 'https://m.media-amazon.com/images/I/61i8Vjb17SL._SL1500_.jpg';
  }
  
  if (lowerTitle.includes('nike') && (lowerTitle.includes('shoe') || lowerTitle.includes('sneaker'))) {
    return 'https://m.media-amazon.com/images/I/71jeoX0rMBL._AC_UX695_.jpg';
  }
  
  if (lowerTitle.includes('adidas') && (lowerTitle.includes('shoe') || lowerTitle.includes('sneaker'))) {
    return 'https://m.media-amazon.com/images/I/81bTuA9K9qL._AC_UX695_.jpg';
  }
  
  if (lowerCategory.includes('electronics')) {
    return 'https://m.media-amazon.com/images/I/71NTi82uBEL._AC_SL1500_.jpg';
  }
  
  if (lowerCategory.includes('footwear') || lowerCategory.includes('shoes')) {
    return 'https://m.media-amazon.com/images/I/61-Ww4OnWIL._AC_UX695_.jpg';
  }
  
  if (lowerCategory.includes('sports')) {
    return 'https://m.media-amazon.com/images/I/81YpuRoACeL._AC_SL1500_.jpg';
  }
  
  if (lowerCategory.includes('headphones')) {
    return 'https://m.media-amazon.com/images/I/61+WYAjltpL._AC_SL1500_.jpg';
  }
  
  if (lowerCategory.includes('speakers')) {
    return 'https://m.media-amazon.com/images/I/716QOWr4QFL._AC_SL1500_.jpg';
  }
  
  return 'https://m.media-amazon.com/images/I/61vjUCzQCaL._SL1500_.jpg';
}
