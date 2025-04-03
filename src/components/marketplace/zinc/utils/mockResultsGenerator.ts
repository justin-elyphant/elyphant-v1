
import { ZincProduct } from '../types';
import { getUseCase, getSuffix } from './productDescriptionUtils';

/**
 * Helper function to create mock results for a search term
 */
export function createMockResults(term: string, category: string, count = 10): ZincProduct[] {
  const capitalize = (s: string) => s.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const brands = ['Amazon Basics', 'Top Brand', 'Quality Seller', 'Premium Choice'];
  const results: ZincProduct[] = [];
  
  // Generate more realistic product images based on category
  const getProductImage = (category: string, index: number): string => {
    const baseImageUrls = {
      'Footwear': [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80',
        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80',
      ],
      'Electronics': [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80',
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500&q=80',
      ],
      'Gaming': [
        'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&q=80',
        'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=500&q=80',
        'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=500&q=80',
      ],
      'Sports': [
        'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=500&q=80',
        'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=500&q=80',
        'https://images.unsplash.com/photo-1511886929837-354d1a107698?w=500&q=80',
      ]
    };
    
    // Use category-specific images if available
    if (baseImageUrls[category as keyof typeof baseImageUrls]) {
      const images = baseImageUrls[category as keyof typeof baseImageUrls];
      return images[index % images.length];
    }
    
    // Default fallback images
    const defaultImages = [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&q=80',
      'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=500&q=80',
    ];
    
    return defaultImages[index % defaultImages.length];
  };
  
  for (let i = 0; i < count; i++) {
    const brand = brands[i % brands.length];
    // Fix: Convert the calculation to a number first, then use toFixed
    const price = 19.99 + (i * 10) + parseFloat((Math.random() * 5).toFixed(2));
    
    results.push({
      product_id: `mock-${term.replace(/\s+/g, '-')}-${i}`,
      title: `${brand} ${capitalize(term)} ${getSuffix(category, i)}`,
      price: parseFloat(price.toFixed(2)),
      image: getProductImage(category, i),
      description: `High quality ${term.toLowerCase()} ${getSuffix(category, i).toLowerCase()} for all your needs. Perfect for ${getUseCase(category)}. Features premium materials and exceptional craftsmanship.`,
      category: category,
      retailer: "Amazon via Zinc",
      brand: brand
    });
  }
  
  return results;
}
