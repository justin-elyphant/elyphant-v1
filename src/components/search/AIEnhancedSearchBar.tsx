import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchState } from "./hooks/useSearchState";
import { useSearchLogic } from "./hooks/useSearchLogic";
import { useSearchHandlers } from "./hooks/useSearchHandlers";
import { useNicoleState } from '@/contexts/nicole/NicoleStateContext';
import { NicoleUnifiedInterface } from '@/components/ai/unified/NicoleUnifiedInterface';
import SearchInput from "./components/SearchInput";
import SearchResults from "./components/SearchResults";

import { Dialog, DialogContent } from "@/components/ui/dialog";

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
    showMobileModal,
    setShowMobileModal,
    isListening,
    setIsListening,
    searchLoading,
    setSearchLoading,
    hasUserInteracted,
    setHasUserInteracted,
    nicoleResponse,
    setNicoleResponse,
    showSearchButton,
    setShowSearchButton,
    inputRef,
    suggestionRef,
    nicoleDropdownRef
  } = useSearchState();

  const { state, actions } = useNicoleState();
  
  // Safely compute Nicole dropdown state after hooks are initialized
  const showNicoleDropdown = state?.activeMode === 'search';

  // Enhanced search logic with friends, products, and brands
  useSearchLogic({
    query,
    isNicoleMode,
    user,
    setSearchLoading,
    setUnifiedResults,
    setShowSuggestions,
    setSuggestions,
    setNicoleResponse,
    setShowSearchButton
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
    setShowNicoleDropdown: (show: boolean) => {
      if (show && actions.canActivateMode('search')) {
        actions.activateMode('search');
      } else if (!show) {
        actions.closeAllModes();
      }
    },
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
        if (actions.canActivateMode('search')) {
          actions.activateMode('search');
        }
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
    actions.closeAllModes();
    setShowMobileModal(false);
    setHasUserInteracted(false);
    
    // If we're on the marketplace page, update the URL to remove search params
    if (location.pathname === '/marketplace') {
      const params = new URLSearchParams(searchParams);
      params.delete('search');
      params.delete('category'); // Clear category to return to general marketplace
      // Keep other parameters like filters, etc.
      
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
    actions.closeAllModes();
    setShowMobileModal(false);
  }, [location.pathname]);

  // Listen for Nicole trigger events from homepage CTAs
  useEffect(() => {
    const handleTriggerNicole = (event: CustomEvent) => {
      console.log("🎯 Nicole trigger event received:", event.detail);
      const { mode, greeting } = event.detail;
      
      // Activate Nicole mode
      setIsNicoleMode(true);
      
      // DON'T set greeting as search query - let Nicole handle its own context
      // This prevents search interference with Nicole greetings
      
      // Open Nicole interface
      if (isMobile) {
        setShowMobileModal(true);
      } else {
        if (actions.canActivateMode('search')) {
          actions.activateMode('search');
        }
      }
      
      // Focus the input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    };

    window.addEventListener('triggerNicole', handleTriggerNicole as EventListener);
    
    return () => {
      window.removeEventListener('triggerNicole', handleTriggerNicole as EventListener);
    };
  }, [isMobile]);

  // Check for Nicole URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nicoleParam = urlParams.get('nicole');
    const modeParam = urlParams.get('mode');
    const greetingParam = urlParams.get('greeting');
    
    console.log("🔍 Search Bar - URL Params Check:", { nicoleParam, modeParam, greetingParam });
    
    if (nicoleParam === 'true') {
      console.log("🎯 Nicole URL trigger detected:", { mode: modeParam, greeting: greetingParam });
      
      // Activate Nicole mode
      setIsNicoleMode(true);
      
      // DON'T set greeting as search query - Nicole handles its own greeting context
      // This prevents the search bar from showing "No results found" for Nicole greetings
      
      // Open Nicole interface directly without setting search query
      setTimeout(() => {
        if (isMobile) {
          setShowMobileModal(true);
        } else {
          if (actions.canActivateMode('search')) {
            actions.activateMode('search');
          }
        }
        
        // Focus the input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      
      // Clean up URL immediately to prevent search interference
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('nicole');
      newUrl.searchParams.delete('mode');
      newUrl.searchParams.delete('greeting');
      newUrl.searchParams.delete('first_name'); // Also clean up first_name param
      window.history.replaceState({}, '', newUrl.pathname + (newUrl.search ? newUrl.search : ''));
    }
  }, [isMobile]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (nicoleDropdownRef.current && !nicoleDropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        actions.closeAllModes();
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
    !isNicoleMode && // Don't show "No results" when Nicole is active
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
      />

      {/* Unified Nicole Interface - Single point of truth for both desktop and mobile */}
      {(showNicoleDropdown || (showMobileModal && isMobile)) && (
        <>
          {isMobile ? (
            <Dialog open={showMobileModal} onOpenChange={() => setShowMobileModal(false)}>
              <DialogContent className="p-0 w-full max-w-full h-[90vh] bg-background">
                <NicoleUnifiedInterface
                  onNavigateToResults={handleNicoleNavigateToResults}
                  className="h-full border-0 shadow-none bg-transparent"
                />
              </DialogContent>
            </Dialog>
          ) : (
            <NicoleUnifiedInterface
              onNavigateToResults={handleNicoleNavigateToResults}
            />
          )}
        </>
      )}

    </div>
  );
};

export default AIEnhancedSearchBar;
