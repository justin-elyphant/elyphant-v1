import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, TrendingUp, Package, Users } from "lucide-react";
import { toast } from "sonner";
import { useSearchSuggestionsLive } from "@/hooks/useSearchSuggestionsLive";
import { useAuth } from "@/contexts/auth";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { supabase } from "@/integrations/supabase/client";
import RecentSearches from "../RecentSearches";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/utils";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";

interface UnifiedSearchBarProps {
  onNavigateToResults?: (searchQuery: string) => void;
  className?: string;
  mobile?: boolean;
}

interface ConnectionResult {
  id: string;
  name: string;
  username: string | null;
  profile_image: string | null;
}

// Skeleton loading component for suggestions
const SuggestionsSkeleton: React.FC = () => (
  <Card className="bg-background border shadow-lg rounded-xl p-3">
    <div className="space-y-3">
      {/* Text suggestions skeleton */}
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
      {/* Product suggestions skeleton */}
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
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recentSearches, addSearch } = useUserSearchHistory();
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
  const [connectionResults, setConnectionResults] = useState<ConnectionResult[]>([]);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Search connections when query changes
  useEffect(() => {
    if (connectionTimerRef.current) clearTimeout(connectionTimerRef.current);
    
    if (!user || !query || query.trim().length < 2) {
      setConnectionResults([]);
      return;
    }

    connectionTimerRef.current = setTimeout(async () => {
      try {
        // Search accepted connections by name/username
        const { data: connections } = await supabase
          .from('user_connections')
          .select('connected_user_id, user_id')
          .eq('status', 'accepted')
          .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);

        if (!connections || connections.length === 0) {
          setConnectionResults([]);
          return;
        }

        const otherIds = connections.map(c => 
          c.user_id === user.id ? c.connected_user_id : c.user_id
        );

        const searchLower = query.trim().toLowerCase();
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, first_name, last_name, username, profile_image')
          .in('id', otherIds);

        if (profiles) {
          const matched = profiles.filter(p => {
            const fullName = (p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()).toLowerCase();
            const uname = (p.username || '').toLowerCase();
            return fullName.includes(searchLower) || uname.includes(searchLower);
          }).slice(0, 4).map(p => ({
            id: p.id,
            name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'User',
            username: p.username,
            profile_image: p.profile_image
          }));
          setConnectionResults(matched);
        }
      } catch (err) {
        console.error('[UnifiedSearchBar] Connection search error:', err);
      }
    }, 350);

    return () => {
      if (connectionTimerRef.current) clearTimeout(connectionTimerRef.current);
    };
  }, [query, user]);
  
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Haptic feedback on iOS
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
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm min-h-[44px] flex items-center touch-manipulation"
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
    const hasSuggestions = liveSuggestions.length > 0 || suggestedProducts.length > 0 || connectionResults.length > 0;
    
    if (!hasSuggestions) {
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
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm min-h-[44px] flex items-center gap-2 touch-manipulation"
                >
                  {suggestion.type === 'trending' && <TrendingUp className="h-3 w-3 text-orange-500" />}
                  <span>{suggestion.text}</span>
                </button>
              ))}
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
              {connectionResults.map((person) => (
                <button
                  key={person.id}
                  onClick={() => {
                    if (isMobile || mobile) triggerHapticFeedback(HapticPatterns.buttonTap);
                    setShowSuggestions(false);
                    navigate(`/profile/${person.username || person.id}`);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] flex items-center gap-3 touch-manipulation"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={person.profile_image || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {person.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{person.name}</p>
                    {person.username && (
                      <p className="text-xs text-muted-foreground">@{person.username}</p>
                    )}
                  </div>
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
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] flex items-center gap-3 touch-manipulation"
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
            className={`transition-all duration-300 bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-gray-500 ${
              mobile || isMobile ? 'text-base h-11 pl-12 pr-12' : 'h-11 text-sm pl-12 pr-12'
            }`}
            style={{ fontSize: mobile || isMobile ? '16px' : '14px' }}
          />
          
          <div className={`absolute flex items-center space-x-1 ${mobile || isMobile ? 'right-2' : 'right-3'}`}>
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
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
