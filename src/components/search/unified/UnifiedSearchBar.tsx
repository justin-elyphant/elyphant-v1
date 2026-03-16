import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, TrendingUp, Package, Users, UserPlus, Clock, UserCheck, ArrowRight, SearchX } from "lucide-react";
import { toast } from "sonner";
import { useSearchSuggestionsLive } from "@/hooks/useSearchSuggestionsLive";
import { useAuth } from "@/contexts/auth";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import RecentSearches from "../RecentSearches";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/utils";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import { searchFriendsWithPrivacy, type FilteredProfile } from "@/services/search/privacyAwareFriendSearch";
import { sendConnectionRequest } from "@/services/connections/connectionService";

interface UnifiedSearchBarProps {
  onNavigateToResults?: (searchQuery: string) => void;
  className?: string;
  mobile?: boolean;
}

// Skeleton loading component for suggestions
const SuggestionsSkeleton: React.FC = () => (
  <Card className="bg-background border shadow-lg rounded-xl p-3">
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="w-4 h-4 bg-muted animate-pulse rounded" />
          <div className="h-3 w-20 bg-muted animate-pulse rounded" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="w-4 h-4 bg-muted animate-pulse rounded" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-12 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </Card>
);

export const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({
  onNavigateToResults,
  className = "",
  mobile = false
}) => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync query with URL search param so text persists after navigation
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setQuery(urlSearch);
    }
  }, [searchParams]);

  // Close suggestions on route change for graceful transitions
  useEffect(() => {
    setShowSuggestions(false);
  }, [location.pathname, location.search]);
  const { user } = useAuth();
  const { recentSearches, addSearch, clearSearchHistory, removeSearch } = useUserSearchHistory();
  const isMobile = useIsMobile();
  
  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isVoiceSupported
  } = useSpeechRecognition();
  
  // Use lightweight suggestions hook
  const { 
    suggestions: liveSuggestions, 
    trending, 
    products: suggestedProducts,
    isLoading: suggestionsLoading 
  } = useSearchSuggestionsLive(query, 300);

  // Connection search state
  const [connectionResults, setConnectionResults] = useState<FilteredProfile[]>([]);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Search people (all profiles) when query changes
  useEffect(() => {
    if (connectionTimerRef.current) clearTimeout(connectionTimerRef.current);
    
    if (!user || !query || query.trim().length < 2) {
      setConnectionResults([]);
      return;
    }

    connectionTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchFriendsWithPrivacy(query.trim(), user.id, 6);
        const filtered = results.filter(r => r.connectionStatus !== 'blocked' && r.id !== user.id);
        setConnectionResults(filtered.slice(0, 4));
      } catch (err) {
        console.error('[UnifiedSearchBar] People search error:', err);
      }
    }, 350);

    return () => {
      if (connectionTimerRef.current) clearTimeout(connectionTimerRef.current);
    };
  }, [query, user]);

  // Handle sending connection request inline
  const handleSendConnectionRequest = async (personId: string, personName: string) => {
    try {
      if (isMobile || mobile) triggerHapticFeedback(HapticPatterns.buttonTap);
      await sendConnectionRequest(personId);
      setConnectionResults(prev => prev.map(p => 
        p.id === personId ? { ...p, connectionStatus: 'pending' as const } : p
      ));
      toast.success(`Connection request sent to ${personName}`);
    } catch (err) {
      console.error('[UnifiedSearchBar] Send connection request error:', err);
      toast.error("Failed to send connection request");
    }
  };
  
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

  // Dismiss keyboard helper for iOS
  const dismissKeyboard = useCallback(() => {
    inputRef.current?.blur();
  }, []);

  // Build flat list of navigable items for keyboard nav
  const flatItems = useMemo(() => {
    if (!query.trim()) return [];
    const items: Array<{ type: 'suggestion' | 'person' | 'product'; data: any }> = [];
    liveSuggestions.slice(0, 5).forEach(s => items.push({ type: 'suggestion', data: s }));
    connectionResults.forEach(p => items.push({ type: 'person', data: p }));
    suggestedProducts.slice(0, 4).forEach(p => items.push({ type: 'product', data: p }));
    return items;
  }, [query, liveSuggestions, connectionResults, suggestedProducts]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, liveSuggestions.length, connectionResults.length, suggestedProducts.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setInputFocused(true);
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    setInputFocused(false);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      if (isMobile || mobile) {
        triggerHapticFeedback(HapticPatterns.buttonTap);
      }
      addSearch(query.trim());
      setShowSuggestions(false);
      dismissKeyboard();
      if (onNavigateToResults) {
        onNavigateToResults(query.trim());
      } else {
        navigate(`/marketplace?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleRecentSearchSelect = (searchTerm: string) => {
    if (isMobile || mobile) {
      triggerHapticFeedback(HapticPatterns.buttonTap);
    }
    setQuery(searchTerm);
    setShowSuggestions(false);
    dismissKeyboard();
    addSearch(searchTerm);
    if (onNavigateToResults) {
      onNavigateToResults(searchTerm);
    } else {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSuggestionClick = (text: string) => {
    if (isMobile || mobile) {
      triggerHapticFeedback(HapticPatterns.buttonTap);
    }
    setQuery(text);
    setShowSuggestions(false);
    dismissKeyboard();
    addSearch(text);
    navigate(`/marketplace?search=${encodeURIComponent(text)}`);
  };

  const handleProductSuggestionClick = (productId: string, title: string) => {
    if (isMobile || mobile) {
      triggerHapticFeedback(HapticPatterns.cardTap);
    }
    setShowSuggestions(false);
    dismissKeyboard();
    addSearch(title);
    navigate(`/product/${productId}`);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (flatItems.length + 1)); // +1 for "see all results"
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev <= 0 ? flatItems.length : prev - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (item.type === 'suggestion') {
          handleSuggestionClick(item.data.text);
        } else if (item.type === 'person') {
          setShowSuggestions(false);
          navigate(`/profile/${item.data.username || item.data.id}`);
        } else if (item.type === 'product') {
          handleProductSuggestionClick(item.data.id, item.data.title);
        }
      } else if (selectedIndex === flatItems.length && query.trim()) {
        // "See all results" item selected
        e.preventDefault();
        handleSearch();
      }
      // If selectedIndex === -1, let the form submit naturally
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Helper to get the flat index for a given section item
  const getFlatIndex = (type: 'suggestion' | 'person' | 'product', sectionIndex: number): number => {
    let offset = 0;
    if (type === 'person') offset = liveSuggestions.slice(0, 5).length;
    if (type === 'product') offset = liveSuggestions.slice(0, 5).length + connectionResults.length;
    return offset + sectionIndex;
  };

  // Clear input and reset URL
  const handleClearInput = () => {
    setQuery("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
    
    // Remove search param from URL if present
    if (searchParams.has('search')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('search');
      setSearchParams(newParams, { replace: true });
    }
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
    if (!showSuggestions) return;
    updatePortalPos();
    const handler = () => updatePortalPos();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [showSuggestions, updatePortalPos, query]);

  const placeholderText = isMobile || mobile 
    ? "Find gifts, friends, and more..." 
    : "Search brands, trending products, friends, and more...";

  // Render suggestions dropdown content
  const renderSuggestionsContent = () => {
    // Show skeleton while loading with a query
    if (suggestionsLoading && query.trim()) {
      return <SuggestionsSkeleton />;
    }

    // If no query, show recent searches AND trending together
    if (!query.trim()) {
      const hasRecent = recentSearches.length > 0;
      const hasTrending = trending.length > 0;
      
      if (!hasRecent && !hasTrending) return null;

      return (
        <Card className="bg-background border shadow-lg rounded-xl p-3 max-h-[400px] overflow-y-auto">
          {/* Recent searches section */}
          {hasRecent && (
            <RecentSearches
              searches={recentSearches}
              onSearchSelect={handleRecentSearchSelect}
              onRemoveSearch={removeSearch}
              onClearAll={clearSearchHistory}
              embedded
            />
          )}
          
          {/* Trending section below recent */}
          {hasTrending && (
            <div className={hasRecent ? "mt-3 pt-3 border-t border-border" : ""}>
              <div className="flex items-center gap-2 mb-2 px-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Trending</span>
              </div>
              <div className="space-y-1">
                {trending.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item.text)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm min-h-[44px] flex items-center touch-manipulation"
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      );
    }

    // Show live suggestions for query
    const hasSuggestions = liveSuggestions.length > 0 || suggestedProducts.length > 0 || connectionResults.length > 0;
    
    // No results state
    if (!hasSuggestions) {
      return (
        <Card className="bg-background border shadow-lg rounded-xl p-4">
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <SearchX className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No results for "<span className="font-medium text-foreground">{query.trim()}</span>"
            </p>
            <p className="text-xs text-muted-foreground">Try a different search term</p>
          </div>
        </Card>
      );
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
              {liveSuggestions.slice(0, 5).map((suggestion, index) => {
                const flatIdx = getFlatIndex('suggestion', index);
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm min-h-[44px] flex items-center gap-2 touch-manipulation ${
                      selectedIndex === flatIdx ? 'bg-muted' : 'hover:bg-muted'
                    }`}
                  >
                    {suggestion.type === 'trending' && <TrendingUp className="h-3 w-3 text-orange-500" />}
                    <span>{suggestion.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* People / Connections */}
        {connectionResults.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2 px-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase">People</span>
            </div>
            <div className="space-y-1">
              {connectionResults.map((person, index) => {
                const flatIdx = getFlatIndex('person', index);
                return (
                  <div
                    key={person.id}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors min-h-[44px] flex items-center gap-3 touch-manipulation ${
                      selectedIndex === flatIdx ? 'bg-muted' : 'hover:bg-muted'
                    }`}
                  >
                    <button
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => {
                        if (isMobile || mobile) triggerHapticFeedback(HapticPatterns.buttonTap);
                        setShowSuggestions(false);
                        navigate(`/profile/${person.username || person.id}`);
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={person.profile_image || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {person.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">{person.name}</p>
                        {person.username && (
                          <p className="text-xs text-muted-foreground">@{person.username}</p>
                        )}
                      </div>
                    </button>
                    {person.connectionStatus === 'connected' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
                        <UserCheck className="h-3 w-3" />
                        Connected
                      </span>
                    )}
                    {person.connectionStatus === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                    {person.connectionStatus === 'none' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendConnectionRequest(person.id, person.name);
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                );
              })}
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
              {suggestedProducts.slice(0, 4).map((product, index) => {
                const flatIdx = getFlatIndex('product', index);
                return (
                  <button
                    key={index}
                    onClick={() => handleProductSuggestionClick(product.id, product.title)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors min-h-[44px] flex items-center gap-3 touch-manipulation ${
                      selectedIndex === flatIdx ? 'bg-muted' : 'hover:bg-muted'
                    }`}
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
                );
              })}
            </div>
          </div>
        )}

        {/* "See all results" footer */}
        {query.trim() && (
          <div className="mt-2 pt-2 border-t border-border">
            <button
              onClick={() => handleSearch()}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm min-h-[44px] flex items-center justify-between touch-manipulation ${
                selectedIndex === flatItems.length ? 'bg-muted' : 'hover:bg-muted'
              }`}
            >
              <span className="text-muted-foreground">
                See all results for "<span className="font-medium text-foreground">{query.trim()}</span>"
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div ref={searchContainerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div ref={barRef} className="relative flex items-center transition-all duration-300 bg-white border border-gray-300 rounded-full hover:border-gray-400 focus-within:border-transparent focus-within:ring-2 focus-within:ring-purple-600">
          <div className={`absolute z-10 ${mobile || isMobile ? 'left-3' : 'left-4'}`}>
            <Search className={`text-gray-400 ${mobile || isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholderText}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className={`transition-all duration-300 bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-gray-500 ${
              mobile || isMobile ? 'text-base h-11 pl-12 pr-12' : 'h-11 text-sm pl-12 pr-12'
            }`}
            style={{ fontSize: mobile || isMobile ? '16px' : '14px' }}
            role="combobox"
            aria-expanded={showSuggestions}
            aria-autocomplete="list"
            aria-haspopup="listbox"
          />
          
          <div className={`absolute flex items-center space-x-1 ${mobile || isMobile ? 'right-2' : 'right-3'}`}>
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearInput}
                className="h-8 w-8 p-0 hover:bg-gray-100 touch-manipulation"
              >
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Search Suggestions Portal */}
      {showSuggestions && createPortal(
        <div
          ref={portalRef}
          style={{ position: 'fixed', left: portalPos.left, top: portalPos.top, width: portalPos.width, zIndex: 10000 }}
          className="pointer-events-auto"
        >
          {renderSuggestionsContent()}
        </div>,
        document.body
      )}
    </div>
  );
};
