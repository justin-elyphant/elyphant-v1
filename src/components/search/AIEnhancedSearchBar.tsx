
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, X, Bot } from "lucide-react";
import { toast } from "sonner";
import { NicoleUnifiedInterface } from "@/components/ai/unified/NicoleUnifiedInterface";
import { NicolePortalContainer } from "@/components/nicole/NicolePortalContainer";
import { IOSSwitch } from "@/components/ui/ios-switch";
import { useSearchMode } from "@/hooks/useSearchMode";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useAuth } from "@/contexts/auth";
import UnifiedSearchSuggestions from "@/components/search/UnifiedSearchSuggestions";
import { FriendSearchResult } from "@/services/search/friendSearchService";
import { Product } from "@/types/product";

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
  const [nicoleContext, setNicoleContext] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const navigate = useNavigate();
  const { isNicoleMode, setMode } = useSearchMode();
  const { user } = useAuth();
  
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

  // Open Nicole interface when mode becomes nicole (from URL or mode toggle)
  useEffect(() => {
    if (isNicoleMode && !isNicoleOpen) {
      // Only open if no other instance is active, or if this instance should take over
      if (!globalNicoleState.isOpen || globalNicoleState.currentInstance === instanceId) {
        globalNicoleState.isOpen = true;
        globalNicoleState.currentInstance = instanceId;
        
        setIsNicoleOpen(true);
        setNicoleContext({
          capability: 'gift_advisor',
          conversationPhase: 'greeting'
        });
        
        toast.success("Nicole is ready to help!", {
          description: "Ask me anything about finding the perfect gift"
        });
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
        
        // Set Nicole context based on event detail
        setNicoleContext({
          capability: event.detail.capability || 'conversation',
          selectedIntent: event.detail.selectedIntent,
          greetingContext: event.detail.greetingContext,
          autoGreeting: event.detail.autoGreeting,
          conversationPhase: 'greeting'
        });
        
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
    if (!isNicoleMode && query.trim().length >= 1) {
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
      if (isNicoleMode) {
        // In Nicole mode, open the conversation
        setNicoleContext({
          capability: 'search',
          conversationPhase: 'greeting'
        });
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

  // Handle friend selection
  const handleFriendSelect = (friend: FriendSearchResult) => {
    setShowSuggestions(false);
    navigate(`/profile/${friend.id}`);
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setShowSuggestions(false);
    navigate(`/marketplace?search=${encodeURIComponent(product.title)}`);
  };

  // Handle brand selection
  const handleBrandSelect = (brand: string) => {
    setShowSuggestions(false);
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
      setNicoleContext(null);
    }
  };

  const handleNicoleClose = () => {
    // Only reset global state if this instance was the active one
    if (globalNicoleState.currentInstance === instanceId) {
      globalNicoleState.isOpen = false;
      globalNicoleState.currentInstance = null;
    }
    setIsNicoleOpen(false);
    setNicoleContext(null);
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
    ? "Ask Nicole anything about gifts..." 
    : "Search brands, trending products, friends, and more...";

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

  return (
    <div ref={searchContainerRef} className={`relative w-full ${className}`}>
      {/* Enhanced Search Bar with Toggle */}
      <form onSubmit={handleSearch} className="relative">
        <div className={`relative flex items-center transition-all duration-300 ${
          isNicoleMode ? 'ring-2 ring-purple-300 ring-offset-2' : ''
        }`}>
          {/* Mode Toggle */}
          <div className="absolute left-3 flex items-center gap-2 z-10">
            <Search className={`h-4 w-4 transition-colors duration-200 ${
              isNicoleMode ? 'text-purple-500' : 'text-gray-400'
            }`} />
            <IOSSwitch
              size="sm"
              checked={isNicoleMode}
              onCheckedChange={handleModeToggle}
              className="touch-manipulation"
            />
            <Bot className={`h-4 w-4 transition-colors duration-200 ${
              isNicoleMode ? 'text-purple-500' : 'text-gray-400'
            }`} />
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholderText}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className={`pl-32 pr-32 transition-all duration-300 ${
              mobile 
                ? "text-base py-3 h-12 rounded-lg" 
                : "h-12 text-base"
            } border-2 ${
              isNicoleMode 
                ? 'border-purple-300 focus:border-purple-500 bg-gradient-to-r from-purple-50/30 to-indigo-50/30' 
                : 'border-border focus:border-primary'
            }`}
          />
          
          <div className="absolute right-2 flex items-center space-x-2">
            {/* Clear Button */}
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setSearchQuery("");
                  setShowSuggestions(false);
                }}
                className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            )}
            
            {/* Search/Ask Button */}
            <Button 
              type="submit" 
              size="sm" 
              className={`h-8 px-3 transition-all duration-300 ${
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

      {/* Unified Search Suggestions - Only show in search mode */}
      {!isNicoleMode && showSuggestions && (
        <UnifiedSearchSuggestions
          friends={unifiedResults.friends}
          products={unifiedResults.products}
          brands={unifiedResults.brands}
          isVisible={showSuggestions}
          onFriendSelect={handleFriendSelect}
          onProductSelect={handleProductSelect}
          onBrandSelect={handleBrandSelect}
          onSendFriendRequest={handleSendFriendRequest}
          mobile={mobile}
        />
      )}

      {/* Nicole Interface - Only render if this instance owns the global state */}
      {isNicoleMode && isNicoleOpen && globalNicoleState.currentInstance === instanceId && (
        <NicolePortalContainer isVisible={true}>
          <NicoleUnifiedInterface
            isOpen={isNicoleOpen}
            onClose={handleNicoleClose}
            onNavigateToResults={handleNicoleNavigate}
            initialContext={nicoleContext}
            className="w-full"
          />
        </NicolePortalContainer>
      )}

    </div>
  );
};

export default AIEnhancedSearchBar;
