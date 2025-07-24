
import { searchFriendsWithPrivacy, FilteredProfile } from "./privacyAwareFriendSearch";
import { unifiedMarketplaceService } from "@/services/marketplace/UnifiedMarketplaceService";
import { Product } from "@/types/product";

export interface UnifiedSearchResults {
  friends: FilteredProfile[];
  products: Product[];
  brands: string[];
  total: number;
}

export interface SearchOptions {
  maxResults?: number;
  currentUserId?: string;
  includeFriends?: boolean;
  includeProducts?: boolean;
  includeBrands?: boolean;
  luxuryCategories?: boolean;
  personId?: string;
  occasionType?: string;
}

const mockBrands = [
  "Nike", "Apple", "Samsung", "Sony", "Microsoft", "Google", "Amazon", 
  "Tesla", "BMW", "Mercedes", "Louis Vuitton", "Gucci", "Rolex",
  "Starbucks", "McDonald's", "Coca-Cola", "Pepsi", "Netflix", "Spotify"
];

export const unifiedSearch = async (
  query: string,
  options: SearchOptions = {}
): Promise<UnifiedSearchResults> => {
  console.log('🔍 [unifiedSearch] Starting unified search:', { query, options });
  
  const {
    maxResults = 10,
    currentUserId,
    includeFriends = true,
    includeProducts = true,
    includeBrands = true
  } = options;

  const results: UnifiedSearchResults = {
    friends: [],
    products: [],
    brands: [],
    total: 0
  };

  // Search friends
  if (includeFriends && query.length >= 2) {
    try {
      console.log('🔍 [unifiedSearch] Searching friends...');
      const friendResults = await searchFriendsWithPrivacy(query, currentUserId);
      results.friends = friendResults.slice(0, Math.floor(maxResults / 3));
      console.log(`🔍 [unifiedSearch] Friend search completed: ${results.friends.length} results`);
    } catch (error) {
      console.error('🔍 [unifiedSearch] Error searching friends:', error);
    }
  }

  // Search products using protected marketplace service
  if (includeProducts && query.length >= 1) {
    try {
      console.log('🔍 [unifiedSearch] Searching products via UnifiedMarketplaceService...');
      const productResults = await unifiedMarketplaceService.searchProducts(query, {
        maxResults: Math.floor(maxResults / 3),
        luxuryCategories: options.luxuryCategories,
        personId: options.personId,
        occasionType: options.occasionType
      });
      results.products = productResults;
      console.log(`🔍 [unifiedSearch] Product search completed: ${results.products.length} results`);
    } catch (error) {
      console.error('🔍 [unifiedSearch] Error searching products:', error);
    }
  }

  // Search brands (mock for now)
  if (includeBrands && query.length >= 2) {
    try {
      console.log('🔍 [unifiedSearch] Searching brands...');
      const brandResults = mockBrands
        .filter(brand => brand.toLowerCase().includes(query.toLowerCase()))
        .slice(0, Math.floor(maxResults / 3));
      results.brands = brandResults;
      console.log(`🔍 [unifiedSearch] Brand search completed: ${results.brands.length} results`);
    } catch (error) {
      console.error('🔍 [unifiedSearch] Error searching brands:', error);
    }
  }

  results.total = results.friends.length + results.products.length + results.brands.length;
  
  console.log('🔍 [unifiedSearch] Unified search completed:', {
    totalResults: results.total,
    friends: results.friends.length,
    products: results.products.length,
    brands: results.brands.length
  });

  return results;
};
