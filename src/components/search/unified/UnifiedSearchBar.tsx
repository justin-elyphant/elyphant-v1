import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, TrendingUp, Package } from "lucide-react";
import { toast } from "sonner";
import { useSearchMode } from "@/hooks/useSearchMode";
import { useSearchSuggestionsLive } from "@/hooks/useSearchSuggestionsLive";
import { useAuth } from "@/contexts/auth";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import RecentSearches from "../RecentSearches";
import { useNicoleDropdown } from "../nicole/NicoleDropdownContext";
import { NicoleSearchDropdown } from "../nicole/NicoleSearchDropdown";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
const SimpleNicolePopup = lazy(() => import("@/components/ai/SimpleNicolePopup"));

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
  
  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isVoiceSupported
  } = useSpeechRecognition();
  
  // Phase 1: Use lightweight suggestions hook
  const { 
    suggestions: liveSuggestions, 
    trending, 
    products: suggestedProducts,
    isLoading: suggestionsLoading 
  } = useSearchSuggestionsLive(query, 300);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [portalPos, setPortalPos] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 });

  const updatePortalPos = useCallback(() => {
    const el = barRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = Math.round(rect.bottom + 8);
    setPortalPos({ left: Math.round(rect.left), top, width: Math.round(rect.width) });
  }, []);

  // Open Nicole when mode changes
  useEffect(() => {
    if (isNicoleMode && !isDropdownOpen && !isModalOpen) {
      openDropdown();
    }
  }, [isNicoleMode, isDropdownOpen, isModalOpen, openDropdown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (!isNicoleMode) {
      setShowSuggestions(true);
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

  const handleRecentSearchSelect = (searchTerm: string) => {
    setQuery(searchTerm);
    setShowSuggestions(false);
    addSearch(searchTerm);
    if (onNavigateToResults) {
      onNavigateToResults(searchTerm);
    } else {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
    setShowSuggestions(false);
    addSearch(text);
    navigate(`/marketplace?search=${encodeURIComponent(text)}`);
  };

  const handleProductSuggestionClick = (productId: string, title: string) => {
    setShowSuggestions(false);
    addSearch(title);
    navigate(`/product/${productId}`);
  };

  // Voice transcript
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setQuery(transcript);
    }
  }, [transcript]);

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
      const target = event.target as Node;
      if (portalRef.current && portalRef.current.contains(target)) {
        return;
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

  // Keep portal positioned
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
            if (budget.minPrice !== undefined) marketplaceUrl.searchParams.set('minPrice', String(budget.minPrice));
            if (budget.maxPrice !== undefined) marketplaceUrl.searchParams.set('maxPrice', String(budget.maxPrice));
          }
        }
        if (nicoleContext.recipient) marketplaceUrl.searchParams.set('recipient', nicoleContext.recipient);
        if (nicoleContext.occasion) marketplaceUrl.searchParams.set('occasion', nicoleContext.occasion);
      }
      
      navigate(marketplaceUrl.pathname + marketplaceUrl.search);
    }
    setTimeout(() => closeAll(), 100);
  };

  const handleNicoleClose = () => {
    closeAll();
    setMode("search");
    const url = new URL(window.location.href);
    if (url.searchParams.get('mode') === 'nicole') {
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Render suggestions dropdown content
  const renderSuggestionsContent = () => {
    // If no query, show recent searches or trending
    if (!query.trim()) {
      if (recentSearches.length > 0) {
        return (
          <RecentSearches
            searches={recentSearches}
            onSearchSelect={handleRecentSearchSelect}
          />
        );
      }
      // Show trending if no recent searches
      if (trending.length > 0) {
        return (
          <Card className="bg-background border shadow-lg rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2 px-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Trending Searches</span>
            </div>
            <div className="space-y-1">
              {trending.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(item.text)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm min-h-[44px] flex items-center"
                >
                  {item.text}
                </button>
              ))}
            </div>
          </Card>
        );
      }
      return null;
    }

    // Show live suggestions for query
    const hasSuggestions = liveSuggestions.length > 0 || suggestedProducts.length > 0;
    
    if (!hasSuggestions && !suggestionsLoading) {
      return null;
    }

    return (
      <Card className="bg-background border shadow-lg rounded-xl p-3 max-h-[400px] overflow-y-auto">
        {/* Text Suggestions */}
        {liveSuggestions.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2 px-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase">Suggestions</span>
            </div>
            <div className="space-y-1">
              {liveSuggestions.slice(0, 5).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm min-h-[44px] flex items-center gap-2"
                >
                  {suggestion.type === 'trending' && <TrendingUp className="h-3 w-3 text-orange-500" />}
                  <span>{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product Suggestions */}
        {suggestedProducts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase">Products</span>
            </div>
            <div className="space-y-1">
              {suggestedProducts.slice(0, 4).map((product, index) => (
                <button
                  key={index}
                  onClick={() => handleProductSuggestionClick(product.id, product.title)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] flex items-center gap-3"
                >
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.title}</p>
                    {product.price > 0 && (
                      <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {suggestionsLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div ref={searchContainerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div ref={barRef} className="relative flex items-center transition-all duration-300 bg-white border border-gray-300 rounded-full hover:border-gray-400 focus-within:border-transparent focus-within:ring-2 focus-within:ring-purple-600">
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
              mobile ? 'text-base h-11 pl-12 pr-12' : 'h-11 text-sm pl-12 pr-12'
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

      {/* Search Suggestions Portal */}
      {!isNicoleMode && showSuggestions && createPortal(
        <div
          ref={portalRef}
          style={{ position: 'fixed', left: portalPos.left, top: portalPos.top, width: portalPos.width, zIndex: 10000 }}
          className="pointer-events-auto"
        >
          {renderSuggestionsContent()}
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
