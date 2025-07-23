
import { useEffect, useState } from "react";
import { unifiedSearch } from "@/services/search/unifiedSearchService";
import { unifiedNicoleAI } from "@/services/ai/unified/UnifiedNicoleAIService";
import { UnifiedNicoleContext } from "@/services/ai/unified/types";

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
  const [nicoleSessionId] = useState(() => `search-${Date.now()}`);
  const [nicoleContext, setNicoleContext] = useState<UnifiedNicoleContext>({
    conversationPhase: 'greeting',
    capability: 'conversation',
    interests: [],
    detectedBrands: [],
    currentUserId: user?.id
  });
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
        // Nicole mode - use unified Nicole AI service for conversational responses
        console.log(`Nicole Mode: Processing conversational query: "${query}"`);
        setSearchLoading(true);
        
        try {
          const response = await unifiedNicoleAI.chat(query, nicoleContext, nicoleSessionId);
          
          console.log('Nicole AI Response:', {
            message: response.message,
            capability: response.capability,
            showSearchButton: response.showSearchButton,
            actions: response.actions
          });
          
          // Update Nicole context for next interaction
          setNicoleContext(response.context);
          
          // Set Nicole's response message
          if (setNicoleResponse) {
            setNicoleResponse(response.message);
          }
          
          // Show search button if Nicole indicates readiness
          if (setShowSearchButton) {
            setShowSearchButton(response.showSearchButton);
          }
          
          // Clear traditional suggestions since we're using Nicole's conversation
          setSuggestions([]);
          
        } catch (error) {
          console.error('Nicole AI Error:', error);
          
          // Fallback to mock suggestions for graceful degradation
          const q = query.toLowerCase();
          const matches = mockSuggestions
            .filter(s => s.toLowerCase().includes(q))
            .slice(0, 5);
          setSuggestions(matches);
          
          if (setNicoleResponse) {
            setNicoleResponse("I'm having trouble right now. Let me show you some suggestions instead.");
          }
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSuggestions([]);
        setUnifiedResults({ friends: [], products: [], brands: [] });
      }
    };

    const debounceTimer = setTimeout(searchUnified, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, isNicoleMode, user?.id, setSearchLoading, setUnifiedResults, setShowSuggestions, setSuggestions]);
};
