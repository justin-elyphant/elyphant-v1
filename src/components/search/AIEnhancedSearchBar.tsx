
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Package, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useSearchLogic } from "./hooks/useSearchLogic";
import { useSearchHandlers } from "./hooks/useSearchHandlers";
import SearchResults from "./components/SearchResults";
import VoiceInputButton from "./VoiceInputButton";
import { NicoleUnifiedInterface } from "@/components/ai/unified/NicoleUnifiedInterface";
import { useNicoleState } from "@/contexts/nicole/NicoleStateContext";

interface AIEnhancedSearchBarProps {
  mobile?: boolean;
  className?: string;
}

const AIEnhancedSearchBar: React.FC<AIEnhancedSearchBarProps> = ({ 
  mobile = false, 
  className = "" 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { state, actions } = useNicoleState();
  
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [unifiedResults, setUnifiedResults] = useState({
    friends: [],
    products: [],
    brands: []
  });
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for triggerNicole events from CTAs
  useEffect(() => {
    const handleTriggerNicole = (event: CustomEvent) => {
      console.log('🎯 AIEnhancedSearchBar received triggerNicole event:', event.detail);
      
      if (actions.canActivateMode('search')) {
        actions.activateMode('search', event.detail);
      }
    };

    window.addEventListener('triggerNicole', handleTriggerNicole as EventListener);
    return () => {
      window.removeEventListener('triggerNicole', handleTriggerNicole as EventListener);
    };
  }, [actions]);

  // Enhanced search logic with friends, products, and brands
  useSearchLogic({
    query,
    isNicoleMode: state.activeMode === 'search',
    user,
    setSearchLoading,
    setUnifiedResults,
    setShowSuggestions,
    setSuggestions
  });

  // Search handlers for different result types
  const {
    handleSubmit,
    handleSuggestionClick,
    handleFriendSelect,
    handleProductSelect,
    handleBrandSelect,
    handleVoiceInput
  } = useSearchHandlers({
    isNicoleMode: state.activeMode === 'search',
    setQuery,
    setShowSuggestions,
    setShowNicoleDropdown: () => {}, // Not used in this component
    setShowMobileModal: () => {}, // Not used in this component
    setIsListening,
    inputRef
  });

  // Mock send friend request function
  const handleSendFriendRequest = (friendId: string, friendName: string) => {
    console.log(`Sending friend request to ${friendName} (${friendId})`);
    // This would integrate with your friend request system
  };

  const handleNavigateToResults = (searchQuery: string) => {
    // Navigate to marketplace with search query
    const searchParams = new URLSearchParams();
    searchParams.set("search", searchQuery);
    navigate(`/marketplace?${searchParams.toString()}`);
    actions.activateMode('closed');
  };

  useEffect(() => {
    setShowSuggestions(false);
    setQuery("");
  }, [location.pathname]);

  const placeholderText = state.activeMode === 'search' 
    ? "Ask Nicole about gifts..." 
    : "Search friends, products, and brands...";

  // Determine what search results to show
  const shouldShowUnifiedSuggestions = showSuggestions && 
    (unifiedResults.friends.length > 0 || unifiedResults.products.length > 0 || unifiedResults.brands.length > 0) &&
    !searchLoading &&
    state.activeMode !== 'search';

  const shouldShowNicoleSuggestions = false; // This component doesn't use Nicole mode

  const shouldShowNoResults = query.length > 1 && 
    !searchLoading && 
    !shouldShowUnifiedSuggestions && 
    unifiedResults.friends.length === 0 && 
    unifiedResults.products.length === 0 && 
    unifiedResults.brands.length === 0 &&
    state.activeMode !== 'search';

  return (
    <div className={`relative w-full ${className}`}>
      {/* Enhanced Search Bar */}
      <form onSubmit={(e) => handleSubmit(e, query)} className="relative flex items-center w-full" autoComplete="off">
        <div className="relative flex-1 flex items-center">
          <div className="absolute left-3 flex items-center">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholderText}
            className={`pl-10 pr-20 transition-all duration-300 ${
              mobile ? "text-base py-3 h-12" : ""
            } rounded-full border-gray-300 focus:border-blue-500`}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => {
              if (unifiedResults.friends.length > 0 || unifiedResults.products.length > 0 || unifiedResults.brands.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />

          {/* Voice Input Button */}
          <VoiceInputButton
            isListening={isListening}
            onVoiceInput={handleVoiceInput}
            mobile={mobile}
          />

          <Button
            type="submit"
            className={`absolute right-2 rounded-full px-3 py-1 text-xs font-semibold h-8 transition-all duration-300 touch-manipulation ${
              mobile ? "min-h-[44px] min-w-[44px]" : ""
            } bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white`}
          >
            Search
          </Button>
        </div>
      </form>

      {/* Search Results */}
      {state.activeMode !== 'search' && (
        <SearchResults
          shouldShowUnifiedSuggestions={shouldShowUnifiedSuggestions}
          shouldShowNicoleSuggestions={shouldShowNicoleSuggestions}
          shouldShowNoResults={shouldShowNoResults}
          searchLoading={searchLoading}
          query={query}
          unifiedResults={unifiedResults}
          suggestions={suggestions}
          onFriendSelect={handleFriendSelect}
          onProductSelect={handleProductSelect}
          onBrandSelect={handleBrandSelect}
          onSendFriendRequest={handleSendFriendRequest}
          onSuggestionClick={handleSuggestionClick}
          mobile={mobile}
          isNicoleMode={false}
        />
      )}

      {/* Nicole Unified Interface - shown when in search mode */}
      {state.activeMode === 'search' && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <NicoleUnifiedInterface 
            onNavigateToResults={handleNavigateToResults}
            className="relative w-full h-[500px] shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default AIEnhancedSearchBar;
