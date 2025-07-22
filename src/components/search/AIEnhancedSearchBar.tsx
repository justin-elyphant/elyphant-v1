import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchState } from "./hooks/useSearchState";
import { useSearchLogic } from "./hooks/useSearchLogic";
import { useSearchHandlers } from "./hooks/useSearchHandlers";
import SearchInput from "./components/SearchInput";
import SearchResults from "./components/SearchResults";
import NicoleDropdown from "./components/NicoleDropdown";
import NicoleMobileModal from "./components/NicoleMobileModal";

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
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [isNicoleMode, setIsNicoleMode] = useState(false);
  
  // Use search state hook for centralized state management
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

  // Enhanced search logic with friends, products, and brands
  useSearchLogic({
    query,
    isNicoleMode,
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

  // Handle mode toggle
  const handleModeToggle = (checked: boolean) => {
    setIsNicoleMode(checked);
    if (checked && query.trim()) {
      if (isMobile) {
        setShowMobileModal(true);
      } else {
        setShowNicoleDropdown(true);
      }
    }
  };

  // Handle user interaction for suggestions
  const handleUserInteraction = () => {
    setHasUserInteracted(true);
    if (query.trim() && (unifiedResults.friends.length > 0 || unifiedResults.products.length > 0 || unifiedResults.brands.length > 0)) {
      setShowSuggestions(true);
    }
  };

  // Handle clear functionality with URL management
  const handleClear = () => {
    // Clear all search-related state
    setShowSuggestions(false);
    setShowNicoleDropdown(false);
    setShowMobileModal(false);
    setHasUserInteracted(false);
    
    // If we're on the marketplace page, update the URL to remove search params
    if (location.pathname === '/marketplace') {
      const params = new URLSearchParams(searchParams);
      params.delete('search');
      // Keep other parameters like category, filters, etc.
      
      if (params.toString()) {
        navigate(`/marketplace?${params.toString()}`, { replace: true });
      } else {
        navigate('/marketplace', { replace: true });
      }
    }
  };

  // Mock send friend request function
  const handleSendFriendRequest = (friendId: string, friendName: string) => {
    console.log(`Sending friend request to ${friendName} (${friendId})`);
    // This would integrate with your friend request system
  };

  // Initialize search term from URL on marketplace
  useEffect(() => {
    if (location.pathname === '/marketplace') {
      const searchParam = searchParams.get("search");
      if (searchParam && searchParam !== query) {
        setQuery(searchParam);
      } else if (!searchParam && query) {
        setQuery("");
      }
    }
  }, [searchParams, location.pathname]);

  // Clear suggestions when navigating away
  useEffect(() => {
    setShowSuggestions(false);
    setShowNicoleDropdown(false);
    setShowMobileModal(false);
  }, [location.pathname]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (nicoleDropdownRef.current && !nicoleDropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowNicoleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine what search results to show
  const shouldShowUnifiedSuggestions = showSuggestions && 
    (unifiedResults.friends.length > 0 || unifiedResults.products.length > 0 || unifiedResults.brands.length > 0) &&
    !searchLoading && !isNicoleMode && hasUserInteracted;

  const shouldShowNicoleSuggestions = showSuggestions && suggestions.length > 0 && 
    !searchLoading && isNicoleMode && hasUserInteracted;

  const shouldShowNoResults = query.length > 1 && 
    !searchLoading && 
    hasUserInteracted &&
    !shouldShowUnifiedSuggestions && 
    !shouldShowNicoleSuggestions && 
    unifiedResults.friends.length === 0 && 
    unifiedResults.products.length === 0 && 
    unifiedResults.brands.length === 0 && 
    suggestions.length === 0;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Enhanced Search Bar */}
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
        onClear={handleClear}
      />

      {/* Search Results */}
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
        ref={suggestionRef}
      />

      {/* Nicole AI Dropdown (Desktop) */}
      <NicoleDropdown
        isOpen={showNicoleDropdown}
        query={query}
        onNavigateToResults={handleNicoleNavigateToResults}
        onClose={handleCloseNicole}
        ref={nicoleDropdownRef}
      />

      {/* Nicole AI Modal (Mobile) */}
      <NicoleMobileModal
        isOpen={showMobileModal}
        onClose={handleCloseNicole}
        query={query}
        onNavigateToResults={handleNicoleNavigateToResults}
      />
    </div>
  );
};

export default AIEnhancedSearchBar;
