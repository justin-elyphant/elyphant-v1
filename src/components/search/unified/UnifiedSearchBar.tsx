import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, X, Bot } from "lucide-react";
import { toast } from "sonner";
import { IOSSwitch } from "@/components/ui/ios-switch";
import { useSearchMode } from "@/hooks/useSearchMode";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useAuth } from "@/contexts/auth";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import VoiceInputButton from "../VoiceInputButton";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import UnifiedSearchSuggestions from "../UnifiedSearchSuggestions";
import RecentSearches from "../RecentSearches";
import { useNicoleDropdown } from "../nicole/NicoleDropdownContext";
import { NicoleSearchDropdown } from "../nicole/NicoleSearchDropdown";
// Lazy load modal for better performance
const SimpleNicolePopup = lazy(() => import("@/components/ai/SimpleNicolePopup"));
import { FriendSearchResult } from "@/services/search/friendSearchService";
import { Product } from "@/types/product";

interface UnifiedSearchBarProps {
  onNavigateToResults?: (searchQuery: string, nicoleContext?: any) => void;
  className?: string;
  mobile?: boolean;
}

export const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({
  onNavigateToResults,
  className = "",
  mobile = false
}) => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  
  const navigate = useNavigate();
  const { isNicoleMode, setMode } = useSearchMode();
  const { user } = useAuth();
  const { recentSearches, addSearch } = useUserSearchHistory();
  const isMobile = useIsMobile();
  
  const {
    isDropdownOpen,
    isModalOpen,
    openDropdown,
    closeDropdown,
    expandToModal,
    closeAll
  } = useNicoleDropdown();
  
  // Voice recognition
  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isVoiceSupported
  } = useSpeechRecognition();
  
  // Unified search
  const { 
    search: performUnifiedSearch, 
    results: unifiedResults,
    isLoading: searchLoading,
    setQuery: setSearchQuery
  } = useUnifiedSearch({ 
    maxResults: 15,
    debounceMs: 300 
  });
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle mode toggle
  const handleModeToggle = (checked: boolean) => {
    setMode(checked ? "nicole" : "search");
    setShowSuggestions(false);
    
    if (checked) {
      openDropdown();
    } else {
      closeAll();
    }
  };

  // Open Nicole when mode changes
  useEffect(() => {
    if (isNicoleMode && !isDropdownOpen && !isModalOpen) {
      openDropdown();
    }
  }, [isNicoleMode, isDropdownOpen, isModalOpen, openDropdown]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSearchQuery(newQuery);
    
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
    if (!isNicoleMode) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setInputFocused(false);
    setTimeout(() => {
      if (!inputFocused) {
        setShowSuggestions(false);
      }
    }, 150);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addSearch(query.trim());
      
      if (isNicoleMode) {
        openDropdown();
      } else {
        setShowSuggestions(false);
        if (onNavigateToResults) {
          onNavigateToResults(query.trim());
        } else {
          navigate(`/marketplace?search=${encodeURIComponent(query.trim())}`);
        }
      }
    }
  };

  // Handle selections
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

  const handleFriendSelect = (friend: FriendSearchResult) => {
    const profilePath = friend.username || friend.id;
    setShowSuggestions(false);
    addSearch(friend.name);
    navigate(`/profile/${profilePath}`);
  };

  const handleProductSelect = (product: Product) => {
    setShowSuggestions(false);
    addSearch(product.title);
    navigate(`/marketplace?search=${encodeURIComponent(product.title)}`);
  };

  const handleBrandSelect = (brand: string) => {
    setShowSuggestions(false);
    addSearch(brand);
    navigate(`/marketplace?search=${encodeURIComponent(brand)}`);
  };

  const handleSendFriendRequest = async (friendId: string, friendName: string) => {
    toast.success(`Friend request sent to ${friendName}!`);
  };

  // Voice input
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

  // Handle voice transcript
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

  const placeholderText = isNicoleMode 
    ? (isMobile ? "Ask Nicole about gifts..." : "Ask Nicole anything about gifts...")
    : (isMobile ? "Find gifts, friends, and more..." : "Search brands, trending products, friends, and more...");

  const handleNicoleNavigate = (searchQuery: string, nicoleContext?: any) => {
    if (onNavigateToResults) {
      onNavigateToResults(searchQuery, nicoleContext);
    } else {
      const marketplaceUrl = new URL('/marketplace', window.location.origin);
      marketplaceUrl.searchParams.set('search', searchQuery);
      
      if (nicoleContext) {
        marketplaceUrl.searchParams.set('source', 'nicole');
        
        if (nicoleContext.budget) {
          const budget = nicoleContext.budget;
          if (Array.isArray(budget) && budget.length === 2) {
            const [min, max] = budget;
            if (typeof min === 'number') marketplaceUrl.searchParams.set('minPrice', String(min));
            if (typeof max === 'number') marketplaceUrl.searchParams.set('maxPrice', String(max));
          } else if (typeof budget === 'object' && budget !== null) {
            if (budget.minPrice !== undefined) {
              marketplaceUrl.searchParams.set('minPrice', String(budget.minPrice));
            }
            if (budget.maxPrice !== undefined) {
              marketplaceUrl.searchParams.set('maxPrice', String(budget.maxPrice));
            }
          }
        }
        
        if (nicoleContext.recipient) {
          marketplaceUrl.searchParams.set('recipient', nicoleContext.recipient);
        }
        if (nicoleContext.occasion) {
          marketplaceUrl.searchParams.set('occasion', nicoleContext.occasion);
        }
      }
      
      navigate(marketplaceUrl.pathname + marketplaceUrl.search);
    }
    
    setTimeout(() => {
      closeAll();
    }, 100);
  };

  const handleNicoleClose = () => {
    closeAll();
    setMode("search");
    
    // Clean up URL
    const url = new URL(window.location.href);
    if (url.searchParams.get('mode') === 'nicole') {
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div ref={searchContainerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className={`relative flex items-center transition-all duration-300 ${
          mobile 
            ? 'bg-background border border-border rounded-lg shadow-sm hover:shadow-md focus-within:shadow-md'
            : 'bg-background border border-border rounded-lg shadow-sm hover:shadow-md focus-within:shadow-md'
        } ${
          isNicoleMode ? 'ring-2 ring-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50' : ''
        }`}>
          {/* Mode Toggle */}
          <div className={`absolute z-10 ${
            mobile ? 'left-2 flex items-center gap-1.5' : 'left-3 flex items-center gap-2'
          }`}>
            <Search className={`transition-colors duration-200 ${
              mobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
            } ${isNicoleMode ? 'text-purple-500' : 'text-muted-foreground'}`} />
            <IOSSwitch
              size="sm"
              checked={isNicoleMode}
              onCheckedChange={handleModeToggle}
              className={`touch-manipulation ${mobile ? 'scale-90' : ''}`}
            />
            <Bot className={`transition-colors duration-200 ${
              mobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
            } ${isNicoleMode ? 'text-purple-500' : 'text-muted-foreground'}`} />
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
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setSearchQuery("");
                  inputRef.current?.focus();
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {isNicoleMode && isMobile && (
              <VoiceInputButton
                isListening={isListening}
                onVoiceInput={handleVoiceInput}
                mobile={mobile}
              />
            )}
            
            <Button
              type="submit"
              size="sm"
              className={`${mobile ? 'h-8' : 'h-8'} px-4 text-sm font-medium`}
            >
              {isNicoleMode ? "Ask" : "Search"}
              {isNicoleMode && (
                <Badge variant="secondary" className="ml-1.5 text-xs">AI</Badge>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Nicole Dropdown */}
      {isNicoleMode && (
        <NicoleSearchDropdown
          onExpand={expandToModal}
          searchQuery={query}
        />
      )}

      {/* Search Suggestions */}
      {!isNicoleMode && showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          {query.trim() ? (
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
          ) : (
            <RecentSearches
              searches={recentSearches}
              onSearchSelect={handleRecentSearchSelect}
            />
          )}
        </div>
      )}

      {/* Full Modal - Lazy Loaded */}
      {isModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-4">Loading Nicole...</div>
        </div>}>
          <SimpleNicolePopup
            isOpen={isModalOpen}
            onClose={handleNicoleClose}
            onNavigateToResults={handleNicoleNavigate}
            canMinimize={true}
            onMinimize={() => {
              closeAll();
              openDropdown();
            }}
          />
        </Suspense>
      )}
    </div>
  );
};
