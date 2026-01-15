
import { searchFriendsWithPrivacy, FilteredProfile, FriendSearchResult } from "./privacyAwareFriendSearch";
import { productCatalogService } from "@/services/ProductCatalogService";
import { Product } from "@/types/product";

export interface UnifiedSearchResults {
  friends: FriendSearchResult[];
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

/**
 * Detect if a query looks like a person's name
 * Simple heuristics: multiple words with capital letters, common name patterns
 * BUT excludes sports teams, brands, and product-related queries
 */
const isLikelyPersonName = (query: string): boolean => {
  const trimmed = query.trim();
  const lowerQuery = trimmed.toLowerCase();
  
  // Known sports teams and brand patterns that should NOT be treated as person names
  const sportsTeamKeywords = [
    'cowboys', 'patriots', 'lakers', 'yankees', 'celtics', 'bulls', 'warriors', 
    'eagles', 'giants', 'united', 'city', 'fc', 'arsenal', 'madrid', 'barcelona',
    'rangers', 'knights', 'saints', 'raiders', 'dolphins', 'bears', 'packers'
  ];
  
  // Product/brand keywords that indicate this is NOT a person name
  const productKeywords = [
    'nike', 'apple', 'samsung', 'laptop', 'phone', 'watch', 'bag', 'shoes',
    'shirt', 'jersey', 'hat', 'cap', 'pants', 'shorts', 'jacket', 'dress',
    'brand', 'store', 'shop', 'merchandise', 'apparel', 'clothing', 'gear',
    'electronics', 'fashion', 'sports', 'athletic', 'running', 'training'
  ];
  
  // If query contains any sports team or product keywords, it's NOT a person name
  const allExclusionKeywords = [...sportsTeamKeywords, ...productKeywords];
  const containsExclusionKeyword = allExclusionKeywords.some(keyword => 
    lowerQuery.includes(keyword)
  );
  
  if (containsExclusionKeyword) {
    return false;
  }
  
  const words = trimmed.split(/\s+/);
  
  // Check if it contains multiple words with capital letters (e.g., "Justin Me", "John Smith")
  // But only if it's 2 words exactly (person names are typically first + last name)
  if (words.length === 2) {
    const hasCapitalizedWords = words.filter(word => /^[A-Z]/.test(word)).length === 2;
    // Only treat as person name if both words are relatively short (typical names are 2-12 chars)
    const bothWordsReasonableLength = words.every(word => word.length >= 2 && word.length <= 12);
    if (hasCapitalizedWords && bothWordsReasonableLength) {
      return true;
    }
  }
  
  // Single capitalized word that's not a common product term
  if (words.length === 1 && /^[A-Z]/.test(trimmed) && !productKeywords.includes(lowerQuery)) {
    return true;
  }
  
  return false;
};

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
      
      // Convert FilteredProfile to FriendSearchResult for UI compatibility
      results.friends = friendResults.slice(0, Math.floor(maxResults / 3)).map(profile => ({
        id: profile.id,
        name: profile.name,
        username: profile.username,
        email: profile.email,
        profile_image: profile.profile_image,
        bio: profile.bio,
        city: profile.city,
        state: profile.state,
        connectionStatus: profile.connectionStatus,
        mutualConnections: profile.mutualConnections || 0,
        lastActive: profile.lastActive,
        privacyLevel: profile.privacyLevel || 'public',
        isPrivacyRestricted: profile.isPrivacyRestricted || false,
        first_name: profile.name.split(' ')[0] || '',
        last_name: profile.name.split(' ').slice(1).join(' ') || ''
      }));
      
      console.log('🔍 [unifiedSearch] Mapped friends with location:', results.friends.map(f => ({ name: f.name, city: f.city, state: f.state })));
      
      console.log(`🔍 [unifiedSearch] Friend search completed: ${results.friends.length} results`);
      console.log('🔍 [unifiedSearch] Friend results formatted for UI:', results.friends);
    } catch (error) {
      console.error('🔍 [unifiedSearch] Error searching friends:', error);
    }
  }

  // Search products using protected marketplace service
  // Skip product search if query looks like a person name
  if (includeProducts && query.length >= 1 && !isLikelyPersonName(query)) {
    try {
      console.log('🔍 [unifiedSearch] Searching products via ProductCatalogService...');
      const response = await productCatalogService.searchProducts(query, {
        limit: Math.floor(maxResults / 3),
        category: options.luxuryCategories ? 'luxury' : undefined,
      });
      results.products = response.products as Product[];
      console.log(`🔍 [unifiedSearch] Product search completed: ${results.products.length} results`);
    } catch (error) {
      console.error('🔍 [unifiedSearch] Error searching products:', error);
    }
  } else if (isLikelyPersonName(query)) {
    console.log('🔍 [unifiedSearch] Skipping product search - query appears to be a person name');
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
