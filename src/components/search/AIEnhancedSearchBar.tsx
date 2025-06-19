
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchMode } from "@/hooks/useSearchMode";
import { useAuth } from "@/contexts/auth";
import { useFriendSearch } from "@/hooks/useFriendSearch";
import NicoleConversationEngine from "@/components/ai/NicoleConversationEngine";
import MobileConversationModal from "@/components/ai/conversation/MobileConversationModal";
import SearchInput from "./components/SearchInput";
import SearchResults from "./components/SearchResults";
import { useSearchState } from "./hooks/useSearchState";
import { useSearchLogic } from "./hooks/useSearchLogic";
import { useSearchHandlers } from "./hooks/useSearchHandlers";

interface AIEnhancedSearchBarProps {
  mobile?: boolean;
  className?: string;
}

const AIEnhancedSearchBar: React.FC<AIEnhancedSearchBarProps> = ({ 
  mobile = false, 
  className = "" 
}) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { mode, setMode, isNicoleMode } = useSearchMode();
  const { sendFriendRequest } = useFriendSearch();
  
  const {
    query,
    setQuery,
    showSuggestions,
    setShowSuggestions,
    suggestions,
    setSuggestions,
    unifiedResults,
    setUnifiedResults,
    showNicoleDropdown,
    setShowNicoleDropdown,
    showMobileModal,
    setShowMobileModal,
    isListening,
    setIsListening,
    searchLoading,
    setSearchLoading,
    hasUserInteracted,
    setHasUserInteracted,
    inputRef,
    suggestionRef,
    nicoleDropdownRef
  } = useSearchState();

  // Handle location changes - clear state when navigating
  useEffect(() => {
    setShowSuggestions(false);
    setHasUserInteracted(false);
    const searchParams = new URLSearchParams(location.search);
    let urlSearchTerm = searchParams.get("search") || "";
    setQuery(urlSearchTerm);
    setShowNicoleDropdown(false);
    setShowMobileModal(false);
  }, [location.pathname]);

  // Use search logic hook
  useSearchLogic({
    query,
    isNicoleMode,
    user,
    setSearchLoading,
    setUnifiedResults,
    setShowSuggestions,
    setSuggestions
  });

  // Use search handlers hook
  const {
    handleSubmit,
    handleSuggestionClick,
    handleFriendSelect,
    handleProductSelect,
    handleBrandSelect,
    handleVoiceInput,
    handleNicoleNavigateToResults,
    handleCloseNicole
  } = useSearchHandlers({
    isNicoleMode,
    setQuery,
    setShowSuggestions,
    setShowNicoleDropdown,
    setShowMobileModal,
    setIsListening,
    inputRef
  });

  const handleClickOutside = (event) => {
    if (
      inputRef.current && !inputRef.current.contains(event.target) &&
      suggestionRef.current && !suggestionRef.current.contains(event.target)
    ) {
      setShowSuggestions(false);
    } 
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle user interaction to show suggestions
  const handleUserInteraction = () => {
    setHasUserInteracted(true);
    if (query.length > 1 && !isNicoleMode) {
      const hasResults = unifiedResults.friends.length > 0 || 
                        unifiedResults.products.length > 0 || 
                        unifiedResults.brands.length > 0;
      setShowSuggestions(hasResults);
    } else if (query.length > 0 && isNicoleMode) {
      setShowSuggestions(suggestions.length > 0);
    }
  };

  // Check URL params for AI mode activation with personalized greeting
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get("mode");
    const openParam = params.get("open");
    const greetingParam = params.get("greeting");
    
    if (modeParam === "nicole") {
      setMode("nicole");
      if (openParam === "true") {
        // Set personalized greeting if specified
        if (greetingParam === "personalized" && user) {
          const firstName = user.user_metadata?.name?.split(' ')[0] || 
                          user.email?.split('@')[0] || 
                          "there";
          setQuery(`Hi ${firstName}, what brings you to Elyphant today?`);
        }
        
        if (isMobile) {
          setShowMobileModal(true);
        } else {
          setShowNicoleDropdown(true);
        }
        
        // Clean up URL params after activation
        const newParams = new URLSearchParams(params);
        newParams.delete("open");
        newParams.delete("greeting");
        const newUrl = newParams.toString() ? 
          `${location.pathname}?${newParams.toString()}` : 
          location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [location.search, isMobile, setMode, user, setQuery]);

  const handleSendFriendRequest = async (friendId: string, friendName: string) => {
    await sendFriendRequest(friendId, friendName);
  };

  const handleModeToggle = (checked: boolean) => {
    const newMode = checked ? "nicole" : "search";
    setMode(newMode);
    setQuery("");
    setShowSuggestions(false);
    setHasUserInteracted(false);
    setShowNicoleDropdown(false);
    setShowMobileModal(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Show unified search results when not in Nicole mode, have query, and user has interacted
  const shouldShowUnifiedSuggestions = !isNicoleMode && hasUserInteracted && showSuggestions && (
    unifiedResults.friends.length > 0 || 
    unifiedResults.products.length > 0 || 
    unifiedResults.brands.length > 0
  );

  // Show Nicole suggestions when in Nicole mode and user has interacted
  const shouldShowNicoleSuggestions = isNicoleMode && hasUserInteracted && showSuggestions && suggestions.length > 0;

  // Show no results message when query exists, user has interacted, but no results
  const shouldShowNoResults = !isNicoleMode && hasUserInteracted && query.length > 1 && !searchLoading && 
    unifiedResults.friends.length === 0 && 
    unifiedResults.products.length === 0 && 
    unifiedResults.brands.length === 0;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Bar */}
      <SearchInput
        query={query}
        setQuery={setQuery}
        isNicoleMode={isNicoleMode}
        handleModeToggle={handleModeToggle}
        handleSubmit={(e) => handleSubmit(e, query)}
        handleVoiceInput={handleVoiceInput}
        isListening={isListening}
        mobile={mobile}
        inputRef={inputRef}
        onUserInteraction={handleUserInteraction}
      />

      {/* Mode Description */}
      {isNicoleMode && (
        <div className="mt-2 text-center">
          <p className="text-xs text-purple-600 font-medium">
            AI Mode Active - Nicole will help find perfect gifts
          </p>
        </div>
      )}

      {/* Search Results */}
      {(shouldShowUnifiedSuggestions || shouldShowNicoleSuggestions || shouldShowNoResults) && (
        <div ref={suggestionRef}>
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
            isNicoleMode={isNicoleMode}
          />
        </div>
      )}

      {/* Desktop Nicole Conversation Dropdown */}
      {showNicoleDropdown && isNicoleMode && !isMobile && (
        <div 
          ref={nicoleDropdownRef}
          className="absolute top-full left-0 right-0 z-50 bg-white shadow-xl border rounded-lg mt-1 max-h-96 overflow-hidden"
        >
          <NicoleConversationEngine
            isOpen={true}
            initialMessage={query}
            onClose={handleCloseNicole}
            onNavigateToMarketplace={handleNicoleNavigateToResults}
          />
        </div>
      )}

      {/* Mobile Nicole Conversation Modal */}
      <MobileConversationModal
        isOpen={showMobileModal}
        onClose={handleCloseNicole}
        initialQuery={query}
        onNavigateToResults={handleNicoleNavigateToResults}
      />
    </div>
  );
};

export default AIEnhancedSearchBar;
