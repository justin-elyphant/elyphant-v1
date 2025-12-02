import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import { createPortal } from "react-dom";
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
  
  // Portal refs for dropdown positioning - using createPortal to bypass any CSS clipping/overflow issues
  const barRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [portalPos, setPortalPos] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 });

  const updatePortalPos = useCallback(() => {
    const el = barRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = Math.round(rect.bottom + 8); // small gap under the bar
    setPortalPos({ left: Math.round(rect.left), top, width: Math.round(rect.width) });
  }, []);

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
    // Don't close on blur - let click-outside handler manage closing
    // This prevents race conditions with selection clicks
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

  // Click outside detection (account for portal)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (portalRef.current && portalRef.current.contains(target)) {
        return; // clicks inside the portal shouldn't close it
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keep portal positioned with the input bar
  useEffect(() => {
    if (!showSuggestions || isNicoleMode) return;
    updatePortalPos();
    const handler = () => updatePortalPos();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [showSuggestions, isNicoleMode, updatePortalPos, query]);

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
        <div ref={barRef} className="relative flex items-center transition-all duration-300 bg-white border border-gray-300 rounded-full hover:border-gray-400 focus-within:border-transparent focus-within:ring-2 focus-within:ring-purple-600">
          {/* Search icon - consistent across all breakpoints */}
          <div className={`absolute z-10 ${mobile ? 'left-3' : 'left-4'}`}>
            <Search className={`text-gray-400 ${mobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholderText}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className={`transition-all duration-300 bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-gray-500 ${
              mobile 
                ? 'text-base h-11 pl-12 pr-12' 
                : 'h-11 text-sm pl-12 pr-12'
            }`}
            style={{ fontSize: mobile ? '16px' : '14px' }}
          />
          
          <div className={`absolute flex items-center space-x-1 ${mobile ? 'right-2' : 'right-3'}`}>
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
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            )}
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
      {!isNicoleMode && showSuggestions && createPortal(
        <div
          ref={portalRef}
          style={{ position: 'fixed', left: portalPos.left, top: portalPos.top, width: portalPos.width, zIndex: 10000 }}
          className="pointer-events-auto"
        >
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
        </div>,
        document.body
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
