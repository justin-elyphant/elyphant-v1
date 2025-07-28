
import { useEffect, useState } from "react";
import { unifiedSearch } from "@/services/search/unifiedSearchService";
// Removed direct Nicole AI service import - respecting protection measures

// ⚠️ DEPRECATION WARNING: This hook is deprecated in favor of useUnifiedSearch
// Please migrate to: import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
// The new hook provides better state management and unified search capabilities
console.warn('useSearchLogic is deprecated. Please migrate to useUnifiedSearch for better performance and unified search capabilities.');

interface SearchLogicProps {
  query: string;
  isNicoleMode: boolean;
  user: any;
  setSearchLoading: (loading: boolean) => void;
  setUnifiedResults: (results: any) => void;
  setShowSuggestions: (show: boolean) => void;
  setSuggestions: (suggestions: string[]) => void;
  setNicoleResponse?: (response: string) => void;
  setShowSearchButton?: (show: boolean) => void;
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
  setSuggestions,
  setNicoleResponse,
  setShowSearchButton
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
          
        } catch (error) {
          console.error('Enhanced Search Logic: Unified search error:', error);
        } finally {
          setSearchLoading(false);
        }
      } else if (query.length > 0 && isNicoleMode) {
        // Nicole mode - The actual Nicole conversation is handled by NicoleUnifiedInterface component
        // This hook only provides fallback suggestions for graceful degradation
        console.log(`Nicole Mode: Query detected, conversation handled by NicoleUnifiedInterface component`);
        
        // Provide fallback suggestions in case Nicole conversation fails
        const q = query.toLowerCase();
        const matches = mockSuggestions
          .filter(s => s.toLowerCase().includes(q))
          .slice(0, 5);
        
        if (matches.length > 0) {
          setSuggestions(matches);
        } else {
          setSuggestions([]);
        }
        
        // Clear search results since we're in conversation mode
        setUnifiedResults({ friends: [], products: [], brands: [] });
      } else {
        setSuggestions([]);
        setUnifiedResults({ friends: [], products: [], brands: [] });
      }
    };

    const debounceTimer = setTimeout(searchUnified, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, isNicoleMode, user?.id, setSearchLoading, setUnifiedResults, setShowSuggestions, setSuggestions]);
};
