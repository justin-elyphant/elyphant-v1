
/**
 * Generate an exact product image URL based on title and category
 */
export function getExactProductImage(title: string, category: string): string {
  const lowerTitle = title.toLowerCase();
  const lowerCategory = category.toLowerCase();
  
  // Use real Amazon product images with proper links
  
  // Apple Products 
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
  
  // Samsung Products
  if (lowerTitle.includes('samsung') && lowerTitle.includes('galaxy')) {
    return 'https://m.media-amazon.com/images/I/61a2y1FCAJL._AC_SL1500_.jpg';
  }
  
  if (lowerTitle.includes('samsung') && lowerTitle.includes('tv')) {
    return 'https://m.media-amazon.com/images/I/91RfzivKmwL._AC_SL1500_.jpg';
  }
  
  // Gaming Products
  if (lowerTitle.includes('playstation') || lowerTitle.includes('ps5')) {
    return 'https://m.media-amazon.com/images/I/51QkER5ynaL._SL1500_.jpg';
  }
  
  if (lowerTitle.includes('xbox')) {
    return 'https://m.media-amazon.com/images/I/61-jjE67aHL._SL1500_.jpg';
  }
  
  if (lowerTitle.includes('nintendo') || lowerTitle.includes('switch')) {
    return 'https://m.media-amazon.com/images/I/61i8Vjb17SL._SL1500_.jpg';
  }
  
  // Category-specific images for featured occasions
  if (lowerCategory.includes('birthday') || lowerTitle.includes('birthday')) {
    return 'https://m.media-amazon.com/images/I/71Bz7V7vgQL._AC_SL1500_.jpg';
  }
  
  if (lowerCategory.includes('wedding') || lowerTitle.includes('wedding')) {
    return 'https://m.media-amazon.com/images/I/71u-1gA4sEL._AC_SL1500_.jpg';
  }
  
  if (lowerCategory.includes('anniversary') || lowerTitle.includes('anniversary')) {
    return 'https://m.media-amazon.com/images/I/81n0+4G0NHL._AC_SL1500_.jpg';
  }
  
  if (lowerCategory.includes('graduation') || lowerTitle.includes('graduation')) {
    return 'https://m.media-amazon.com/images/I/71awGJRl0YL._AC_SL1500_.jpg';
  }
  
  if (lowerCategory.includes('baby') || lowerCategory.includes('baby_shower')) {
    return 'https://m.media-amazon.com/images/I/81F-QS3DsRL._SL1500_.jpg';
  }
  
  if (lowerCategory.includes('pet') || lowerTitle.includes('pet') || lowerTitle.includes('dog') || lowerTitle.includes('cat')) {
    return 'https://m.media-amazon.com/images/I/81irQM60KdL._AC_SL1500_.jpg';
  }
  
  // Also match "pets" category
  if (lowerCategory === 'pets' || lowerCategory.includes('pets')) {
    return 'https://m.media-amazon.com/images/I/71jdA5tRvBL._AC_SL1500_.jpg';
  }
  
  // Summer Products
  if (lowerCategory.includes('summer') || lowerTitle.includes('summer')) {
    return 'https://m.media-amazon.com/images/I/81SxsPuSVFL._AC_SL1500_.jpg';
  }
  
  // Office Products
  if (lowerCategory.includes('office') || lowerTitle.includes('office')) {
    return 'https://m.media-amazon.com/images/I/71NTi82uBEL._AC_SL1500_.jpg';
  }
  
  // Technology and electronics
  if (lowerCategory.includes('electronics') || lowerTitle.includes('tech')) {
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
  
  if (lowerCategory === 'all' || lowerTitle.includes('all occasions')) {
    return 'https://m.media-amazon.com/images/I/71vjUCzQCaL._SL1500_.jpg';
  }
  
  // Home category
  if (lowerCategory.includes('home') || lowerTitle.includes('home')) {
    return 'https://m.media-amazon.com/images/I/81WQpftHHxL._AC_SL1500_.jpg';
  }
  
  // Default Amazon product image for anything else - we have a few fallbacks
  const defaultImages = [
    'https://m.media-amazon.com/images/I/61vjUCzQCaL._SL1500_.jpg',
    'https://m.media-amazon.com/images/I/71NTi82uBEL._AC_SL1500_.jpg',
    'https://m.media-amazon.com/images/I/81gC7frRJyL._AC_SL1500_.jpg',
    'https://m.media-amazon.com/images/I/71+3+8VcGFL._AC_SL1500_.jpg'
  ];
  
  // Use a deterministic but seemingly random selection based on the title and category
  const hash = (title + category).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const index = Math.abs(hash) % defaultImages.length;
  return defaultImages[index];
}
