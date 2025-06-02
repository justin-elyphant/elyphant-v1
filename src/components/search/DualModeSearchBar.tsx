
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchMode } from "@/hooks/useSearchMode";
import { Badge } from "@/components/ui/badge";
import NicoleConversationEngine from "@/components/ai/NicoleConversationEngine";
import MobileConversationModal from "@/components/ai/conversation/MobileConversationModal";
import CategoryFilterBar from "./CategoryFilterBar";
import VoiceInputButton from "./VoiceInputButton";
import SearchSuggestions from "./SearchSuggestions";
import SearchModeToggle from "./SearchModeToggle";

interface DualModeSearchBarProps {
  mobile?: boolean;
  className?: string;
}

const DualModeSearchBar: React.FC<DualModeSearchBarProps> = ({ 
  mobile = false, 
  className = "" 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { mode, setMode, isNicoleMode } = useSearchMode();
  
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showNicoleDropdown, setShowNicoleDropdown] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const nicoleDropdownRef = useRef<HTMLDivElement>(null);

  // Mock suggestions for demo
  const mockSuggestions = [
    "Birthday gifts for mom",
    "Christmas presents under $50",
    "Tech gifts for dad",
    "Graduation gifts",
    "Anniversary presents"
  ];

  useEffect(() => {
    setShowSuggestions(false);
    setQuery("");
    setShowNicoleDropdown(false);
    setShowMobileModal(false);
  }, [location.pathname]);

  useEffect(() => {
    if (query.length > 0 && !isNicoleMode) {
      const q = query.toLowerCase();
      const matches = mockSuggestions
        .filter(s => s.toLowerCase().includes(q))
        .slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [query, isNicoleMode]);

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
    if (selectedCategory) {
      searchParams.set("category", selectedCategory);
    }
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
    if (selectedCategory) {
      searchParams.set("category", selectedCategory);
    }
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
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

    recognition.onstart = () => {
      setIsListening(true);
    };

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

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleCategorySelect = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    // If there's a current query, trigger search with new category
    if (query || categoryValue) {
      const searchParams = new URLSearchParams();
      if (query) searchParams.set("search", query);
      if (categoryValue) searchParams.set("category", categoryValue);
      navigate(`/marketplace?${searchParams.toString()}`);
    }
  };

  const placeholderText = isNicoleMode 
    ? "Ask Nicole anything about gifts..." 
    : "Search for gifts or products";

  const SearchIcon = isNicoleMode ? MessageCircle : Search;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative flex items-center w-full" autoComplete="off">
        <div className={`relative flex-1 flex items-center transition-all duration-300 ${
          isNicoleMode ? 'ring-2 ring-purple-300 ring-offset-2' : ''
        }`}>
          {/* Mode Toggle Inside Search Bar with Search Icon */}
          <SearchModeToggle
            isNicoleMode={isNicoleMode}
            onModeToggle={handleModeToggle}
          />
          
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
            onFocus={() => {
              if (!isNicoleMode) {
                setShowSuggestions(suggestions.length > 0);
              }
            }}
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

      {/* Category Filter Bar - Only show for product search mode */}
      {!isNicoleMode && (
        <CategoryFilterBar
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          mobile={mobile}
        />
      )}

      {/* Mode Description */}
      {isNicoleMode && (
        <div className="mt-2 text-center">
          <p className="text-xs text-purple-600 font-medium">
            AI Mode Active - Nicole will help find perfect gifts
          </p>
        </div>
      )}

      {/* Product Search Suggestions */}
      <SearchSuggestions
        suggestions={suggestions}
        isVisible={showSuggestions && !isNicoleMode}
        onSuggestionClick={handleSuggestionClick}
        mobile={mobile}
      />

      {/* Desktop Nicole Conversation Dropdown */}
      {showNicoleDropdown && isNicoleMode && !isMobile && (
        <div 
          ref={nicoleDropdownRef}
          className="absolute top-full left-0 right-0 z-50 bg-white shadow-xl border rounded-lg mt-1 max-h-96 overflow-hidden"
        >
          <NicoleConversationEngine
            initialQuery={query}
            onClose={() => setShowNicoleDropdown(false)}
            onNavigateToResults={(searchQuery) => {
              navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}&mode=nicole`);
              setShowNicoleDropdown(false);
            }}
          />
        </div>
      )}

      {/* Mobile Nicole Conversation Modal */}
      <MobileConversationModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        initialQuery={query}
        onNavigateToResults={(searchQuery) => {
          navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}&mode=nicole`);
          setShowMobileModal(false);
        }}
      />
    </div>
  );
};

export default DualModeSearchBar;
