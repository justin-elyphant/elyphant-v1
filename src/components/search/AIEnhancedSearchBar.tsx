
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUrlSearchTerm } from "@/hooks/useUrlSearchTerm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, X, Bot } from "lucide-react";
import { toast } from "sonner";
import SimpleNicolePopup from "@/components/ai/SimpleNicolePopup";
import { IOSSwitch } from "@/components/ui/ios-switch";
import { useSearchMode } from "@/hooks/useSearchMode";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useAuth } from "@/contexts/auth";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import VoiceInputButton from "./VoiceInputButton";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import UnifiedSearchSuggestions from "@/components/search/UnifiedSearchSuggestions";
import RecentSearches from "@/components/search/RecentSearches";
import { FriendSearchResult } from "@/services/search/friendSearchService";
import { Product } from "@/types/product";
import { getCategoryDisplayNameFromSearchTerm, isCategorySearchTerm } from "@/utils/categoryDisplayMapper";

// Global state to prevent duplicate Nicole interfaces
let globalNicoleState = {
  isOpen: false,
  currentInstance: null as string | null
};

interface AIEnhancedSearchBarProps {
  onNavigateToResults?: (searchQuery: string, nicoleContext?: any) => void;
  className?: string;
  mobile?: boolean;
}

const AIEnhancedSearchBar: React.FC<AIEnhancedSearchBarProps> = ({ 
  onNavigateToResults, 
  className = "",
  mobile = false
}) => {
  const [query, setQuery] = useState("");
  const [isNicoleOpen, setIsNicoleOpen] = useState(false);
  const [nicoleWelcomeMessage, setNicoleWelcomeMessage] = useState<string | undefined>();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const navigate = useNavigate();
  const { isNicoleMode, setMode } = useSearchMode();
  const { user } = useAuth();
  const { recentSearches, addSearch } = useUserSearchHistory();
  const isMobile = useIsMobile();
  const { searchTerm: urlSearchTerm } = useUrlSearchTerm();
  
  // Voice recognition hook - only for mobile Nicole mode
  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isVoiceSupported
  } = useSpeechRecognition();
  
  // Unified search hook for friend/product/brand search
  const { 
    search: performUnifiedSearch, 
    results: unifiedResults,
    isLoading: searchLoading,
    setQuery: setSearchQuery
  } = useUnifiedSearch({ 
    maxResults: 15,
    debounceMs: 300 
  });
  
  // Refs for click outside detection
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Create unique instance ID for this search bar
  const instanceId = React.useMemo(() => `${mobile ? 'mobile' : 'desktop'}-${Math.random()}`, [mobile]);

  // Initialize and sync search term from URL
  useEffect(() => {
    // Check if this is a category search term and display the clean name
    const displayTerm = isCategorySearchTerm(urlSearchTerm) 
      ? getCategoryDisplayNameFromSearchTerm(urlSearchTerm)
      : urlSearchTerm;
    
    setQuery(displayTerm);
    setSearchQuery(displayTerm);
  }, [urlSearchTerm, setSearchQuery]);

  // Open Nicole interface when mode becomes nicole (from URL or mode toggle)
  useEffect(() => {
    if (isNicoleMode && !isNicoleOpen) {
      // Only open if no other instance is active, or if this instance should take over
      if (!globalNicoleState.isOpen || globalNicoleState.currentInstance === instanceId) {
        globalNicoleState.isOpen = true;
        globalNicoleState.currentInstance = instanceId;
        
        setIsNicoleOpen(true);
        // Let SimpleNicolePopup handle the greeting internally
        setNicoleWelcomeMessage(undefined);
      }
    }
  }, [isNicoleMode, isNicoleOpen, instanceId]);

  // Listen for triggerNicole events for auto-greeting functionality
  useEffect(() => {
    const handleTriggerNicole = (event: CustomEvent) => {
      console.log('🎯 AIEnhancedSearchBar received triggerNicole event:', event.detail);
      
      // Only handle if no other instance is active, or if this should take over
      if (!globalNicoleState.isOpen || event.detail.source) {
        globalNicoleState.isOpen = true;
        globalNicoleState.currentInstance = instanceId;
        
        // Set welcome message based on event detail
        if (event.detail.greetingContext || event.detail.autoGreeting) {
          setNicoleWelcomeMessage(event.detail.autoGreeting || "I'm here to help with your gifting needs!");
        } else {
          setNicoleWelcomeMessage(undefined);
        }
        
        // Open Nicole interface
        setIsNicoleOpen(true);
        setMode("nicole");
      }
    };

    window.addEventListener('triggerNicole', handleTriggerNicole as EventListener);
    return () => {
      window.removeEventListener('triggerNicole', handleTriggerNicole as EventListener);
    };
  }, [instanceId, setMode]);

  // Handle input changes and trigger search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSearchQuery(newQuery);
    
    // Only show suggestions in search mode and if there's a query
    if (!isNicoleMode && newQuery.trim().length >= 1) {
      setShowSuggestions(true);
      console.log('🔍 [AIEnhancedSearchBar] Triggering unified search for:', newQuery, {
        currentUserId: user?.id,
        includeFriends: true,
        includeProducts: true,
        includeBrands: true
      });
      performUnifiedSearch(newQuery, {
        currentUserId: user?.id,
        includeFriends: true,
        includeProducts: true,
        includeBrands: true
      });
    } else {
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    setInputFocused(true);
    // Show suggestions on focus in search mode (includes recent searches when query is empty)
    if (!isNicoleMode) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setInputFocused(false);
    // Delay hiding suggestions to allow clicks on suggestions
    setTimeout(() => {
      if (!inputFocused) {
        setShowSuggestions(false);
      }
    }, 150);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Add to search history
      addSearch(query.trim());
      
      if (isNicoleMode) {
        // In Nicole mode, open the conversation with search context
        setNicoleWelcomeMessage(`I'd love to help you search for "${query.trim()}". Let me find some great options!`);
        setIsNicoleOpen(true);
      } else {
        // In search mode, navigate to results
        setShowSuggestions(false);
        if (onNavigateToResults) {
          onNavigateToResults(query.trim());
        } else {
          navigate(`/marketplace?search=${encodeURIComponent(query.trim())}`);
        }
      }
    }
  };

  // Handle recent search selection
  const handleRecentSearchSelect = (searchTerm: string) => {
    setQuery(searchTerm);
    setSearchQuery(searchTerm);
    setShowSuggestions(false);
    addSearch(searchTerm);
    
    if (onNavigateToResults) {
      onNavigateToResults(searchTerm);
    } else {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  // Handle friend selection
  const handleFriendSelect = (friend: FriendSearchResult) => {
    // Ensure proper profile navigation path
    const profilePath = friend.username || friend.id;
    console.log(`🔍 [AI SEARCH NAVIGATION] Navigating to profile:`, {
      id: friend.id,
      name: friend.name,
      username: friend.username,
      email: friend.email,
      targetUrl: `/profile/${profilePath}`
    });
    
    setShowSuggestions(false);
    addSearch(friend.name); // Add friend name to search history
    
    // Navigate with proper error handling
    try {
      navigate(`/profile/${profilePath}`);
    } catch (error) {
      console.error('🔍 [AI SEARCH NAVIGATION] Navigation error:', error);
      toast.error('Failed to navigate to profile');
    }
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setShowSuggestions(false);
    addSearch(product.title); // Add product title to search history
    navigate(`/marketplace?search=${encodeURIComponent(product.title)}`);
  };

  // Handle brand selection
  const handleBrandSelect = (brand: string) => {
    setShowSuggestions(false);
    addSearch(brand); // Add brand to search history
    navigate(`/marketplace?search=${encodeURIComponent(brand)}`);
  };

  // Handle friend request sending
  const handleSendFriendRequest = async (friendId: string, friendName: string) => {
    // This would typically call a friend request service
    toast.success(`Friend request sent to ${friendName}!`);
  };

  const handleModeToggle = (checked: boolean) => {
    setMode(checked ? "nicole" : "search");
    setShowSuggestions(false); // Hide suggestions when switching modes
    
    if (checked) {
      // Close any existing Nicole interface before opening this one
      if (globalNicoleState.isOpen && globalNicoleState.currentInstance !== instanceId) {
        // Close other instances by resetting global state
        globalNicoleState.isOpen = false;
        globalNicoleState.currentInstance = null;
      }
      
      // Set this instance as the active one
      globalNicoleState.isOpen = true;
      globalNicoleState.currentInstance = instanceId;
    } else {
      // Only reset global state if this instance was the active one
      if (globalNicoleState.currentInstance === instanceId) {
        globalNicoleState.isOpen = false;
        globalNicoleState.currentInstance = null;
      }
      setIsNicoleOpen(false);
      setNicoleWelcomeMessage(undefined);
    }
  };

  const handleNicoleClose = () => {
    // Only reset global state if this instance was the active one
    if (globalNicoleState.currentInstance === instanceId) {
      globalNicoleState.isOpen = false;
      globalNicoleState.currentInstance = null;
    }
    
    // Clean up URL parameters - remove mode=nicole
    const url = new URL(window.location.href);
    if (url.searchParams.get('mode') === 'nicole') {
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url.toString());
    }
    
    setIsNicoleOpen(false);
    setNicoleWelcomeMessage(undefined);
    setMode("search"); // Reset to search mode when closing
  };

  const handleNicoleNavigate = (searchQuery: string, nicoleContext?: any) => {
    if (onNavigateToResults) {
      onNavigateToResults(searchQuery, nicoleContext);
    } else {
      // Serialize Nicole context into URL parameters
      const marketplaceUrl = new URL('/marketplace', window.location.origin);
      marketplaceUrl.searchParams.set('search', searchQuery);
      
      if (nicoleContext) {
        // Add Nicole source indicator
        marketplaceUrl.searchParams.set('source', 'nicole');
        
        // Add budget/price range if available (supports multiple shapes)
        if (nicoleContext && nicoleContext.budget) {
          const budget = nicoleContext.budget;
          // Case 1: [min, max] array
          if (Array.isArray(budget) && budget.length === 2) {
            const [min, max] = budget;
            if (typeof min === 'number') marketplaceUrl.searchParams.set('minPrice', String(min));
            if (typeof max === 'number') marketplaceUrl.searchParams.set('maxPrice', String(max));
          }
          // Case 2: { minPrice, maxPrice } object
          else if (typeof budget === 'object' && budget !== null) {
            if (budget.minPrice !== undefined) {
              marketplaceUrl.searchParams.set('minPrice', String(budget.minPrice));
            }
            if (budget.maxPrice !== undefined) {
              marketplaceUrl.searchParams.set('maxPrice', String(budget.maxPrice));
            }
          }
        }
        // Fallback: explicit minPrice/maxPrice on root
        if (nicoleContext?.minPrice !== undefined) {
          marketplaceUrl.searchParams.set('minPrice', String(nicoleContext.minPrice));
        }
        if (nicoleContext?.maxPrice !== undefined) {
          marketplaceUrl.searchParams.set('maxPrice', String(nicoleContext.maxPrice));
        }
        
        // Add recipient information
        if (nicoleContext.recipient) {
          marketplaceUrl.searchParams.set('recipient', nicoleContext.recipient);
        }
        
        // Add occasion information
        if (nicoleContext.occasion) {
          marketplaceUrl.searchParams.set('occasion', nicoleContext.occasion);
        }
        
        console.log('🎯 Nicole Navigation with context:', {
          searchQuery,
          nicoleContext,
          url: marketplaceUrl.pathname + marketplaceUrl.search
        });
      }
      
      navigate(marketplaceUrl.pathname + marketplaceUrl.search);
    }
    
    // Add a delay before closing to allow navigation to complete
    setTimeout(() => {
      setIsNicoleOpen(false);
    }, 100);
  };

  const placeholderText = isNicoleMode 
    ? (isMobile ? "Ask Nicole about gifts..." : "Ask Nicole anything about gifts...")
    : (isMobile ? "Find gifts, friends, and more..." : "Search brands, trending products, friends, and more...");

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle voice transcript updates
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setQuery(transcript);
      setSearchQuery(transcript);
    }
  }, [transcript, setSearchQuery]);

  // Handle voice errors
  useEffect(() => {
    if (voiceError) {
      toast.error("Voice recognition error", {
        description: "Please try again or type your search"
      });
      resetTranscript();
    }
  }, [voiceError, resetTranscript]);

  // Voice input handler
  const handleVoiceInput = () => {
    if (!isVoiceSupported) {
      toast.error("Voice not supported", {
        description: "Your browser doesn't support voice input"
      });
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  return (
    <div ref={searchContainerRef} className={`relative w-full ${className}`}>
      {/* Enhanced Search Bar with Toggle */}
      <form onSubmit={handleSearch} className="relative">
        <div className={`relative flex items-center transition-all duration-300 ${
          mobile 
            ? 'bg-gray-50 border border-gray-300 rounded-lg shadow-sm hover:shadow-md focus-within:shadow-md'
            : 'bg-gray-50 border border-gray-300 rounded-lg shadow-sm hover:shadow-md focus-within:shadow-md'
        } ${
          isNicoleMode ? 'ring-2 ring-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50' : ''
        }`}>
          {/* Mobile and Desktop Mode Toggle */}
          <div className={`absolute z-10 ${
            mobile ? 'left-2 flex items-center gap-1.5' : 'left-3 flex items-center gap-2'
          }`}>
            <Search className={`transition-colors duration-200 ${
              mobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
            } ${isNicoleMode ? 'text-purple-500' : 'text-gray-400'}`} />
            <IOSSwitch
              size="sm"
              checked={isNicoleMode}
              onCheckedChange={handleModeToggle}
              className={`touch-manipulation ${mobile ? 'scale-90' : ''}`}
            />
            <Bot className={`transition-colors duration-200 ${
              mobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
            } ${isNicoleMode ? 'text-purple-500' : 'text-gray-400'}`} />
            {isNicoleMode && (
              <Sparkles className={`text-purple-500 animate-pulse ${
                mobile ? 'h-2.5 w-2.5' : 'h-3 w-3'
              }`} />
            )}
          </div>
          
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholderText}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className={`transition-all duration-300 bg-transparent border-0 ${
              mobile 
                ? 'text-base py-3 h-11 pl-24 pr-16 focus:ring-0 focus:outline-none' 
                : "h-12 text-base pl-32 pr-32 focus:ring-0 focus:outline-none"
            }`}
          />
          
          <div className="absolute right-2 flex items-center space-x-1">
            
            {/* Clear Button - Both Mobile and Desktop */}
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setSearchQuery("");
                  setShowSuggestions(false);
                  resetTranscript();
                  // Navigate back to main marketplace without search params
                  navigate('/marketplace');
                }}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-200 touch-manipulation min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:h-6 md:w-6"
              >
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            )}
            
            
            {/* Desktop Search Button */}
            {!isMobile && (
              <Button 
                type="submit" 
                size="sm" 
                className={`transition-all duration-300 h-8 px-3 ml-2 ${
                  isNicoleMode
                    ? "bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 border border-purple-200"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {isNicoleMode ? (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Ask Nicole
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3 mr-1" />
                    Search
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* AI Enhancement Badge */}
        {isNicoleMode && (
          <div className="absolute -top-2 left-32">
            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200">
              <Sparkles className="h-2.5 w-2.5 mr-1" />
              AI Enhanced
            </Badge>
          </div>
        )}
      </form>

      {/* Search Suggestions and Recent Searches - Only show in search mode */}
      {!isNicoleMode && showSuggestions && (
        (!query.trim() || query.trim().length < 2) && recentSearches.length > 0 ? (
          <RecentSearches
            searches={recentSearches}
            onSearchSelect={handleRecentSearchSelect}
            mobile={mobile}
          />
        ) : query.trim().length >= 1 ? (
          <UnifiedSearchSuggestions
            friends={unifiedResults.friends || []}
            products={unifiedResults.products || []}
            brands={unifiedResults.brands || []}
            isVisible={showSuggestions}
            onFriendSelect={handleFriendSelect}
            onProductSelect={handleProductSelect}
            onBrandSelect={handleBrandSelect}
            onSendFriendRequest={handleSendFriendRequest}
            mobile={mobile}
          />
        ) : null
      )}

      {/* Nicole Interface - Only render if this instance owns the global state */}
      {isNicoleMode && isNicoleOpen && globalNicoleState.currentInstance === instanceId && (
        <SimpleNicolePopup
          isOpen={isNicoleOpen}
          onClose={handleNicoleClose}
          welcomeMessage={nicoleWelcomeMessage}
        />
      )}

    </div>
  );
};

export default AIEnhancedSearchBar;
