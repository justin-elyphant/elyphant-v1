
import { ZincProduct } from '../types';
import { ZINC_API_BASE_URL, getZincHeaders } from '../zincCore';
import { handleSpecialCases } from '../utils/specialCaseHandler';
import { findMappedTerm, getWellKnownTermMappings } from '../utils/termMapper';

/**
 * Search for products on Amazon via Zinc API
 */
export const searchProducts = async (query: string): Promise<ZincProduct[]> => {
  console.log(`Searching products for query: ${query}`);
  
  if (!query || query.trim().length <= 2) {
    console.log('Search query too short, returning empty results');
    return [];
  }
  
  // Handle special case for Apple products
  const normalizedQuery = query.toLowerCase().trim();
  if (normalizedQuery === 'apple' || normalizedQuery === 'apple products') {
    console.log('Special case handling for Apple products');
    return getAppleTechProducts();
  }
  
  // Check for other special cases
  const specialResults = handleSpecialCases(query);
  if (specialResults) {
    console.log(`Returning special case results for: ${query}`);
    return specialResults;
  }
  
  // Check for mapped terms
  const mappedTerm = findMappedTerm(query);
  if (mappedTerm) {
    console.log(`Using mapped term: ${mappedTerm} for query: ${query}`);
    query = mappedTerm;
  }

  // For Apple, always add "technology" to the search to avoid fruits
  if (normalizedQuery.includes('apple') && !normalizedQuery.includes('technology')) {
    query = `${query} technology`;
    console.log(`Modified query to avoid fruits: ${query}`);
  }
  
  try {
    const url = `${ZINC_API_BASE_URL}/search?query=${encodeURIComponent(query)}&retailer=amazon&limit=100`;
    const headers = getZincHeaders();
    
    console.log('Calling Zinc API:', url);
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zinc API error:', response.status, errorText);
      throw new Error(`Zinc API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Zinc API response received');
    
    if (data.results && Array.isArray(data.results)) {
      console.log(`Processing ${data.results.length} results from Zinc API`);
      
      return data.results.map((item: any, index: number) => {
        // Determine if product is a best seller (top 10% of results)
        const isBestSeller = index < Math.ceil(data.results.length * 0.1);
        
        // Normalize the price (API sometimes returns cents instead of dollars)
        let price = 0;
        if (typeof item.price === 'number') {
          price = item.price > 1000 ? item.price / 100 : item.price;
        } else if (item.price) {
          price = parseFloat(String(item.price));
        }
        
        // Ensure we have an image array
        const images = item.images && Array.isArray(item.images) ? 
          item.images : 
          (item.image ? [item.image] : ['/placeholder.svg']);
        
        // Try to extract brand from title if not provided
        const brand = item.brand || extractBrandFromTitle(item.title || "");
        
        return {
          product_id: item.product_id || item.asin || `unknown-${index}`,
          title: item.title || "Unknown Product",
          price: price,
          image: item.image || '/placeholder.svg',
          images: images,
          description: item.description || item.product_description || '',
          brand: brand,
          category: item.category || 'Electronics',
          retailer: "Amazon via Zinc",
          rating: item.rating || item.stars || 0,
          stars: item.stars || item.rating || 0,
          review_count: item.review_count || item.num_reviews || 0,
          num_reviews: item.num_reviews || item.review_count || 0,
          features: item.features || item.bullet_points || [],
          specifications: item.specifications || {},
          isBestSeller: isBestSeller
        };
      });
    }
    
    console.log('No results found in Zinc API response');
    return [];
  } catch (error) {
    console.error('Error searching products via Zinc:', error);
    throw error; // Let the caller handle the error
  }
};

/**
 * Extract brand name from product title
 */
const extractBrandFromTitle = (title: string): string => {
  // Common brand words that might appear in titles
  const commonBrands = [
    'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Microsoft', 'Dell', 'HP', 
    'LG', 'Bose', 'Amazon', 'Google', 'Logitech', 'Levi\'s', 'Nintendo', 'Canon',
    'Lego', 'Lululemon'
  ];
  
  for (const brand of commonBrands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // Return the first word as a fallback
  return title.split(' ')[0];
};

/**
 * Get Apple technology products
 */
const getAppleTechProducts = (): ZincProduct[] => {
  return [
    {
      product_id: 'apple-iphone-1',
      title: 'Apple iPhone 15 Pro, 256GB, Space Black',
      price: 999.99,
      image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&h=500&fit=crop',
      images: ['https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&h=500&fit=crop'],
      description: 'The latest iPhone with A16 chip, amazing camera system, and all-day battery life.',
      brand: 'Apple',
      category: 'Electronics',
      retailer: 'Amazon via Zinc',
      rating: 4.8,
      stars: 4.8,
      review_count: 1245,
      num_reviews: 1245,
      features: ['A16 Bionic chip', 'Pro camera system', 'Always-On display', '5G capable'],
      specifications: {
        'Storage': '256GB',
        'Display': '6.1-inch Super Retina XDR',
        'Camera': '48MP main camera' 
      },
      isBestSeller: true
    },
    {
      product_id: 'apple-macbook-1',
      title: 'Apple MacBook Air 13.6" Laptop with M2 chip',
      price: 1199.99,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop'],
      description: 'The remarkably thin MacBook Air with M2 chip for incredible performance and battery life.',
      brand: 'Apple',
      category: 'Electronics',
      retailer: 'Amazon via Zinc',
      rating: 4.9,
      stars: 4.9,
      review_count: 895,
      num_reviews: 895,
      features: ['M2 chip', 'Up to 18 hours battery life', 'Fanless design', '13.6-inch Liquid Retina display'],
      specifications: {
        'Processor': 'Apple M2',
        'Memory': '8GB unified memory',
        'Storage': '256GB SSD'
      },
      isBestSeller: true
    },
    {
      product_id: 'apple-ipad-1',
      title: 'Apple iPad Pro 12.9" with M2 chip and XDR display',
      price: 1099.99,
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop',
      images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop'],
      description: 'The ultimate iPad experience with the powerful M2 chip and stunning Liquid Retina XDR display.',
      brand: 'Apple',
      category: 'Electronics',
      retailer: 'Amazon via Zinc',
      rating: 4.7,
      stars: 4.7,
      review_count: 732,
      num_reviews: 732,
      features: ['M2 chip', 'Liquid Retina XDR display', 'Thunderbolt port', 'Works with Apple Pencil'],
      specifications: {
        'Display': '12.9-inch Liquid Retina XDR',
        'Storage': '256GB',
        'Connectivity': 'Wi-Fi 6E'
      },
      isBestSeller: true
    },
    {
      product_id: 'apple-watch-1',
      title: 'Apple Watch Series 9 GPS + Cellular 45mm',
      price: 499.99,
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop',
      images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop'],
      description: 'Advanced health monitoring and connectivity features in a sleek, durable design.',
      brand: 'Apple',
      category: 'Electronics',
      retailer: 'Amazon via Zinc',
      rating: 4.6,
      stars: 4.6,
      review_count: 526,
      num_reviews: 526,
      features: ['S9 chip', 'Always-On Retina display', 'Cellular connectivity', 'ECG app'],
      specifications: {
        'Case size': '45mm',
        'Water resistance': '50 meters',
        'Battery': 'Up to 18 hours'
      },
      isBestSeller: false
    }
  ];
};
