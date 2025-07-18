
import { searchFriendsWithPrivacy, FilteredProfile } from "./privacyAwareFriendSearch";
import { ZincProduct } from "@/components/marketplace/zinc/types";

export interface UnifiedSearchResults {
  friends: FilteredProfile[];
  products: ZincProduct[];
  brands: string[];
  total: number;
}

export interface UnifiedSearchOptions {
  maxResults?: number;
  currentUserId?: string;
  includeFriends?: boolean;
  includeProducts?: boolean;
  includeBrands?: boolean;
}

const mockProducts: ZincProduct[] = [
  {
    product_id: "1",
    title: "Wireless Bluetooth Headphones",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    rating: 4.5,
    review_count: 1250,
    retailer: "amazon"
  },
  {
    product_id: "2", 
    title: "Smart Fitness Watch",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    rating: 4.3,
    review_count: 856,
    retailer: "amazon"
  }
];

const mockBrands = [
  "Apple", "Nike", "Samsung", "Lululemon", "Stanley", "Made In", "Lego", "Sony"
];

export const unifiedSearch = async (
  query: string,
  options: UnifiedSearchOptions = {}
): Promise<UnifiedSearchResults> => {
  const {
    maxResults = 10,
    currentUserId,
    includeFriends = true,
    includeProducts = true,
    includeBrands = true
  } = options;

  console.log(`Unified Search: "${query}" with options:`, {
    currentUserId: currentUserId || 'unauthenticated',
    maxResults,
    includeFriends,
    includeProducts,
    includeBrands
  });

  const results: UnifiedSearchResults = {
    friends: [],
    products: [],
    brands: [],
    total: 0
  };

  try {
    // Search for friends with improved privacy handling
    if (includeFriends && query.length >= 2) {
      console.log('Unified Search: Starting friend search...');
      const friendResults = await searchFriendsWithPrivacy(query, currentUserId);
      results.friends = friendResults.slice(0, Math.floor(maxResults / 3));
      console.log(`Unified Search: Found ${friendResults.length} friends, using ${results.friends.length}`);
    }

    // Search for products (mock data for now)
    if (includeProducts && query.length >= 2) {
      console.log('Unified Search: Starting product search...');
      const productResults = mockProducts.filter(product =>
        product.title.toLowerCase().includes(query.toLowerCase())
      );
      results.products = productResults.slice(0, Math.floor(maxResults / 3));
      console.log(`Unified Search: Found ${productResults.length} products, using ${results.products.length}`);
    }

    // Search for brands (mock data for now)
    if (includeBrands && query.length >= 2) {
      console.log('Unified Search: Starting brand search...');
      const brandResults = mockBrands.filter(brand =>
        brand.toLowerCase().includes(query.toLowerCase())
      );
      results.brands = brandResults.slice(0, Math.floor(maxResults / 3));
      console.log(`Unified Search: Found ${brandResults.length} brands, using ${results.brands.length}`);
    }

    results.total = results.friends.length + results.products.length + results.brands.length;
    
    console.log(`Unified Search Results Summary:`, {
      friends: results.friends.length,
      products: results.products.length,
      brands: results.brands.length,
      total: results.total
    });

    return results;

  } catch (error) {
    console.error('Unified search error:', error);
    return results;
  }
};
