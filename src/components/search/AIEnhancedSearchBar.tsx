
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bot, Sparkles, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchMode } from "@/hooks/useSearchMode";
import { Badge } from "@/components/ui/badge";
import NicoleConversationEngine from "@/components/ai/NicoleConversationEngine";
import MobileConversationModal from "@/components/ai/conversation/MobileConversationModal";
import SearchSuggestions from "./SearchSuggestions";
import UnifiedSearchSuggestions from "./UnifiedSearchSuggestions";
import VoiceInputButton from "./VoiceInputButton";
import { IOSSwitch } from "@/components/ui/ios-switch";
import { useAuth } from "@/contexts/auth";
import { unifiedSearch } from "@/services/search/unifiedSearchService";
import { useFriendSearch } from "@/hooks/useFriendSearch";
import { FriendSearchResult } from "@/services/search/friendSearchService";
import { ZincProduct } from "@/components/marketplace/zinc/types";

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
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { mode, setMode, isNicoleMode } = useSearchMode();
  const { sendFriendRequest } = useFriendSearch();
  
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [unifiedResults, setUnifiedResults] = useState<{
    friends: FriendSearchResult[];
    products: ZincProduct[];
    brands: string[];
  }>({ friends: [], products: [], brands: [] });
  const [showNicoleDropdown, setShowNicoleDropdown] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const nicoleDropdownRef = useRef<HTMLDivElement>(null);

  // Mock suggestions for Nicole mode
  const mockSuggestions = [
    "Birthday gifts for mom",
    "Christmas presents under $50",
    "Tech gifts for dad",
    "Graduation gifts",
    "Anniversary presents"
  ];

  // Check URL params for AI mode activation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get("mode");
    const openParam = params.get("open");
    
    if (modeParam === "nicole") {
      setMode("nicole");
      if (openParam === "true") {
        if (isMobile) {
          setShowMobileModal(true);
        } else {
          setShowNicoleDropdown(true);
        }
      }
    }
  }, [location.search, isMobile, setMode]);

  useEffect(() => {
    setShowSuggestions(false);
    setQuery("");
    setShowNicoleDropdown(false);
    setShowMobileModal(false);
  }, [location.pathname]);

  useEffect(() => {
    const searchUnified = async () => {
      if (query.length > 1 && !isNicoleMode) {
        console.log(`Starting unified search for: "${query}"`);
        setSearchLoading(true);
        try {
          const results = await unifiedSearch(query, {
            maxResults: 10,
            currentUserId: user?.id
          });
          
          console.log('Unified search results:', {
            friends: results.friends.length,
            products: results.products.length,
            brands: results.brands.length,
            total: results.total
          });
          
          setUnifiedResults({
            friends: results.friends,
            products: results.products,
            brands: results.brands
          });
          
          const hasResults = results.friends.length > 0 || results.products.length > 0 || results.brands.length > 0;
          console.log('Has unified results:', hasResults);
          setShowSuggestions(hasResults);
        } catch (error) {
          console.error('Unified search error:', error);
          setShowSuggestions(false);
        } finally {
          setSearchLoading(false);
        }
      } else if (query.length > 0 && isNicoleMode) {
        // Nicole mode - show traditional suggestions
        const q = query.toLowerCase();
        const matches = mockSuggestions
          .filter(s => s.toLowerCase().includes(q))
          .slice(0, 5);
        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
        setUnifiedResults({ friends: [], products: [], brands: [] });
      }
    };

    const debounceTimer = setTimeout(searchUnified, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, isNicoleMode, user?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNicoleMode) {
      if (isMobile) {
        setShowMobileModal(true);
      } else {
        setShowNicoleDropdown(true);
      }
      return;
    }

    const searchParams = new URLSearchParams();
    searchParams.set("search", query);
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isNicoleMode) {
      setQuery(suggestion);
      if (isMobile) {
        setShowMobileModal(true);
      } else {
        setShowNicoleDropdown(true);
      }
      return;
    }

    setQuery(suggestion);
    const searchParams = new URLSearchParams();
    searchParams.set("search", suggestion);
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
  };

  const handleFriendSelect = (friend: FriendSearchResult) => {
    // Navigate to friend's profile (assuming we have profile routes)
    navigate(`/profile/${friend.id}`);
    setShowSuggestions(false);
  };

  const handleProductSelect = (product: ZincProduct) => {
    // Navigate to product details
    navigate(`/marketplace?search=${encodeURIComponent(product.title)}`);
    setShowSuggestions(false);
  };

  const handleBrandSelect = (brand: string) => {
    // Navigate to brand search
    navigate(`/marketplace?search=${encodeURIComponent(brand)}`);
    setShowSuggestions(false);
  };

  const handleSendFriendRequest = async (friendId: string, friendName: string) => {
    await sendFriendRequest(friendId, friendName);
  };

  const handleModeToggle = (checked: boolean) => {
    const newMode = checked ? "nicole" : "search";
    setMode(newMode);
    setQuery("");
    setShowSuggestions(false);
    setShowNicoleDropdown(false);
    setShowMobileModal(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input not supported in this browser");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      if (isNicoleMode) {
        if (isMobile) {
          setShowMobileModal(true);
        } else {
          setShowNicoleDropdown(true);
        }
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleNicoleNavigateToResults = (searchQuery: string) => {
    navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
    setShowNicoleDropdown(false);
    setShowMobileModal(false);
  };

  const handleCloseNicole = () => {
    setShowNicoleDropdown(false);
    setShowMobileModal(false);
    // Clean up URL params
    const params = new URLSearchParams(location.search);
    params.delete("mode");
    params.delete("open");
    if (params.toString()) {
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    } else {
      navigate(location.pathname, { replace: true });
    }
  };

  const placeholderText = isNicoleMode 
    ? "Ask Nicole anything about gifts..." 
    : "Search friends, products, or brands";

  // Show unified search results when not in Nicole mode and have query
  const shouldShowUnifiedSuggestions = !isNicoleMode && showSuggestions && (
    unifiedResults.friends.length > 0 || 
    unifiedResults.products.length > 0 || 
    unifiedResults.brands.length > 0
  );

  // Show Nicole suggestions when in Nicole mode
  const shouldShowNicoleSuggestions = isNicoleMode && showSuggestions && suggestions.length > 0;

  // Show no results message when query exists but no results
  const shouldShowNoResults = !isNicoleMode && query.length > 1 && !searchLoading && 
    unifiedResults.friends.length === 0 && 
    unifiedResults.products.length === 0 && 
    unifiedResults.brands.length === 0;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative flex items-center w-full" autoComplete="off">
        <div className={`relative flex-1 flex items-center transition-all duration-300 ${
          isNicoleMode ? 'ring-2 ring-purple-300 ring-offset-2' : ''
        }`}>
          {/* AI Mode Toggle */}
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
            {isNicoleMode && (
              <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
            )}
          </div>
          
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholderText}
            className={`pl-32 pr-20 transition-all duration-300 ${
              mobile ? "text-base py-3 h-12" : ""
            } rounded-full border-gray-300 ${
              isNicoleMode 
                ? 'border-purple-300 focus:border-purple-500 bg-gradient-to-r from-purple-50/30 to-indigo-50/30' 
                : 'focus:border-blue-500'
            }`}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />

          {/* Voice Input Button */}
          <VoiceInputButton
            isListening={isListening}
            onVoiceInput={handleVoiceInput}
            mobile={mobile}
          />

          <Button
            type="submit"
            className={`absolute right-2 rounded-full px-3 py-1 text-xs font-semibold h-8 transition-all duration-300 touch-manipulation ${
              mobile ? "min-h-[44px] min-w-[44px]" : ""
            } ${
              isNicoleMode 
                ? "bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white shadow-lg"
                : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white"
            }`}
          >
            {isNicoleMode ? "Ask" : "Search"}
            {isNicoleMode && (
              <Badge variant="secondary" className="ml-1 text-xs bg-white/20">AI</Badge>
            )}
          </Button>
        </div>
      </form>

      {/* Mode Description */}
      {isNicoleMode && (
        <div className="mt-2 text-center">
          <p className="text-xs text-purple-600 font-medium">
            AI Mode Active - Nicole will help find perfect gifts
          </p>
        </div>
      )}

      {/* Loading indicator */}
      {searchLoading && query.length > 1 && !isNicoleMode && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white shadow-lg border rounded-md mt-1 p-3 text-center text-sm text-gray-600">
          Searching...
        </div>
      )}

      {/* No results message */}
      {shouldShowNoResults && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white shadow-lg border rounded-md mt-1 p-3 text-center text-sm text-gray-500">
          No results found for "{query}"
        </div>
      )}

      {/* Unified Search Suggestions */}
      {shouldShowUnifiedSuggestions && (
        <UnifiedSearchSuggestions
          friends={unifiedResults.friends}
          products={unifiedResults.products}
          brands={unifiedResults.brands}
          isVisible={true}
          onFriendSelect={handleFriendSelect}
          onProductSelect={handleProductSelect}
          onBrandSelect={handleBrandSelect}
          onSendFriendRequest={handleSendFriendRequest}
          mobile={mobile}
        />
      )}

      {/* Nicole Mode Traditional Suggestions */}
      {shouldShowNicoleSuggestions && (
        <SearchSuggestions
          suggestions={suggestions}
          isVisible={true}
          onSuggestionClick={handleSuggestionClick}
          mobile={mobile}
        />
      )}

      {/* Desktop Nicole Conversation Dropdown */}
      {showNicoleDropdown && isNicoleMode && !isMobile && (
        <div 
          ref={nicoleDropdownRef}
          className="absolute top-full left-0 right-0 z-50 bg-white shadow-xl border rounded-lg mt-1 max-h-96 overflow-hidden"
        >
          <NicoleConversationEngine
            initialQuery={query}
            onClose={handleCloseNicole}
            onNavigateToResults={handleNicoleNavigateToResults}
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
