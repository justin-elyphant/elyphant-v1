
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
  "Anniversary presents"
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
        console.log(`Starting unified search for: "${query}"`);
        setSearchLoading(true);
        try {
          const results = await unifiedSearch(query, {
            maxResults: 10,
            currentUserId: user?.id
          });
          
          console.log('Unified search results:', {
            friends: results.friends.length,
            products: results.products.length,
            brands: results.brands.length,
            total: results.total
          });
          
          setUnifiedResults({
            friends: results.friends,
            products: results.products,
            brands: results.brands
          });
          
          const hasResults = results.friends.length > 0 || results.products.length > 0 || results.brands.length > 0;
          console.log('Has unified results:', hasResults);
          setShowSuggestions(hasResults);
        } catch (error) {
          console.error('Unified search error:', error);
          setShowSuggestions(false);
        } finally {
          setSearchLoading(false);
        }
      } else if (query.length > 0 && isNicoleMode) {
        // Nicole mode - show traditional suggestions
        const q = query.toLowerCase();
        const matches = mockSuggestions
          .filter(s => s.toLowerCase().includes(q))
          .slice(0, 5);
        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
        setUnifiedResults({ friends: [], products: [], brands: [] });
      }
    };

    const debounceTimer = setTimeout(searchUnified, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, isNicoleMode, user?.id]);
};
