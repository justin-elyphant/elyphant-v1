
import { useEffect } from "react";
import { unifiedSearch } from "@/services/search/unifiedSearchService";

interface SearchLogicProps {
  query: string;
  isNicoleMode: boolean;
  user: any;
  setSearchLoading: (loading: boolean) => void;
  setUnifiedResults: (results: any) => void;
  setShowSuggestions: (show: boolean) => void;
  setSuggestions: (suggestions: string[]) => void;
}

const mockSuggestions = [
  "Birthday gifts for mom",
  "Christmas presents under $50", 
  "Tech gifts for dad",
  "Graduation gifts",
  "Anniversary presents",
  "Dallas Cowboys merchandise",
  "Made In kitchen gear",
  "Nike running shoes"
];

export const useSearchLogic = ({
  query,
  isNicoleMode,
  user,
  setSearchLoading,
  setUnifiedResults,
  setShowSuggestions,
  setSuggestions
}: SearchLogicProps) => {
  useEffect(() => {
    const searchUnified = async () => {
      if (query.length > 1 && !isNicoleMode) {
        console.log(`Enhanced Search Logic: Starting unified search for: "${query}"`);
        setSearchLoading(true);
        try {
          const results = await unifiedSearch(query, {
            maxResults: 10,
            currentUserId: user?.id,
            includeFriends: true,
            includeProducts: true,
            includeBrands: true
          });
          
          console.log('Enhanced Search Logic: Unified search results:', {
            friends: results.friends.length,
            products: results.products.length,
            brands: results.brands.length,
            total: results.total
          });
          
          // Log the actual friend results for debugging
          if (results.friends.length > 0) {
            console.log('Enhanced Search Logic: Friend results found:', results.friends);
          } else {
            console.log('Enhanced Search Logic: No friend results found for query:', query);
          }
          
          setUnifiedResults({
            friends: results.friends,
            products: results.products,
            brands: results.brands
          });
          
          // Don't automatically show suggestions here - let the component handle it based on user interaction
        } catch (error) {
          console.error('Enhanced Search Logic: Unified search error:', error);
        } finally {
          setSearchLoading(false);
        }
      } else if (query.length > 0 && isNicoleMode) {
        // Nicole mode - show enhanced suggestions that include specific brands/products
        const q = query.toLowerCase();
        const matches = mockSuggestions
          .filter(s => s.toLowerCase().includes(q))
          .slice(0, 5);
        setSuggestions(matches);
        // Don't automatically show suggestions here - let the component handle it based on user interaction
      } else {
        setSuggestions([]);
        setUnifiedResults({ friends: [], products: [], brands: [] });
      }
    };

    const debounceTimer = setTimeout(searchUnified, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, isNicoleMode, user?.id, setSearchLoading, setUnifiedResults, setShowSuggestions, setSuggestions]);
};
