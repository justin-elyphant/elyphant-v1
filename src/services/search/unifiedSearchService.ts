
import { searchFriends, FriendSearchResult } from "./friendSearchService";
import { searchProducts } from "@/components/marketplace/zinc/services/productSearchService";
import { ZincProduct } from "@/components/marketplace/zinc/types";

export interface UnifiedSearchResult {
  friends: FriendSearchResult[];
  products: ZincProduct[];
  brands: string[];
  query: string;
  total: number;
}

export interface SearchOptions {
  maxResults?: number;
  includeFriends?: boolean;
  includeProducts?: boolean;
  includeBrands?: boolean;
  currentUserId?: string;
}

const POPULAR_BRANDS = [
  'Nike', 'Apple', 'Samsung', 'Sony', 'Microsoft', 'Google', 'Amazon',
  'Adidas', 'Puma', 'Under Armour', 'Levi\'s', 'Coach', 'Louis Vuitton',
  'Gucci', 'Rolex', 'Canon', 'Nikon', 'Dell', 'HP', 'Lenovo'
];

export const searchBrands = (query: string, maxResults: number = 5): string[] => {
  if (!query || query.length < 2) return [];
  
  const queryLower = query.toLowerCase();
  return POPULAR_BRANDS
    .filter(brand => brand.toLowerCase().includes(queryLower))
    .slice(0, maxResults);
};

export const unifiedSearch = async (
  query: string,
  options: SearchOptions = {}
): Promise<UnifiedSearchResult> => {
  const {
    maxResults = 10,
    includeFriends = true,
    includeProducts = true,
    includeBrands = true,
    currentUserId
  } = options;

  console.log(`Unified search for: "${query}"`);

  const result: UnifiedSearchResult = {
    friends: [],
    products: [],
    brands: [],
    query,
    total: 0
  };

  // Run searches in parallel
  const searchPromises: Promise<any>[] = [];

  if (includeFriends) {
    searchPromises.push(
      searchFriends(query, currentUserId).then(friends => {
        result.friends = friends.slice(0, Math.min(maxResults, 5));
      }).catch(error => {
        console.error('Friend search failed:', error);
        result.friends = [];
      })
    );
  }

  if (includeProducts) {
    searchPromises.push(
      searchProducts(query, maxResults.toString()).then(products => {
        result.products = products.slice(0, maxResults);
      }).catch(error => {
        console.error('Product search failed:', error);
        result.products = [];
      })
    );
  }

  if (includeBrands) {
    searchPromises.push(
      Promise.resolve().then(() => {
        result.brands = searchBrands(query, 3);
      })
    );
  }

  await Promise.all(searchPromises);

  result.total = result.friends.length + result.products.length + result.brands.length;

  return result;
};
