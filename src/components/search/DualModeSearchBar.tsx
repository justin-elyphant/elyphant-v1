import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, Mic, Grid3X3, ChevronDown, Sparkles, Bot } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchMode } from "@/hooks/useSearchMode";
import { Badge } from "@/components/ui/badge";
import { IOSSwitch } from "@/components/ui/ios-switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NicoleConversationEngine from "@/components/ai/NicoleConversationEngine";
import MobileConversationModal from "@/components/ai/conversation/MobileConversationModal";

interface DualModeSearchBarProps {
  mobile?: boolean;
  className?: string;
}

const categories = [
  { name: "All Categories", value: "" },
  { name: "Electronics", value: "electronics" },
  { name: "Fashion", value: "fashion" },
  { name: "Home & Garden", value: "home" },
  { name: "Sports & Outdoors", value: "sports" },
  { name: "Beauty & Personal Care", value: "beauty" },
  { name: "Books & Media", value: "books" },
  { name: "Toys & Games", value: "toys" },
];

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

  const selectedCategoryName = categories.find(cat => cat.value === selectedCategory)?.name || "All Categories";

  const placeholderText = isNicoleMode 
    ? "Ask Nicole anything about gifts..." 
    : "Search for gifts or products";

  const SearchIcon = isNicoleMode ? MessageCircle : Search;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Bar with Integrated Toggle */}
      <form onSubmit={handleSubmit} className="relative flex items-center w-full" autoComplete="off">
        <div className={`relative flex-1 flex items-center transition-all duration-300 ${
          isNicoleMode ? 'ring-2 ring-purple-300 ring-offset-2 nicole-mode-glow' : ''
        }`}>
          {/* Enhanced Mode Toggle Inside Search Bar with Prominent Icons */}
          <div className="absolute left-3 flex items-center gap-2 z-10">
            <SearchIcon className={`h-4 w-4 transition-colors duration-200 ${
              isNicoleMode ? 'text-purple-500' : 'text-gray-400'
            }`} />
            <div className="relative">
              <IOSSwitch
                size={isMobile ? "md" : "sm"}
                checked={isNicoleMode}
                onCheckedChange={handleModeToggle}
                className="touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              />
              {/* Enhanced mode indicator icons inside the switch */}
              <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
                <Search className={`transition-all duration-200 ${
                  isMobile ? 'h-3.5 w-3.5' : 'h-3 w-3'
                } ${
                  !isNicoleMode 
                    ? 'opacity-100 text-white drop-shadow-sm' 
                    : 'opacity-30 text-gray-500'
                }`} />
                <Bot className={`transition-all duration-200 ${
                  isMobile ? 'h-3.5 w-3.5' : 'h-3 w-3'
                } ${
                  isNicoleMode 
                    ? 'opacity-100 text-white drop-shadow-sm animate-pulse' 
                    : 'opacity-30 text-gray-500'
                }`} />
              </div>
            </div>
            {isNicoleMode && (
              <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
            )}
          </div>
          
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholderText}
            className={`transition-all duration-300 rounded-full border-gray-300 ${
              isMobile 
                ? "pl-20 pr-28 text-base py-3 h-14 leading-relaxed" 
                : "pl-24 pr-32 h-12"
            } ${
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

          {/* Category selector for product search mode */}
          {!isNicoleMode && (
            <div className={`absolute border-l border-gray-300 pl-2 ${
              isMobile ? 'right-16' : 'right-20'
            }`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`text-gray-600 hover:text-gray-900 touch-manipulation ${
                      isMobile 
                        ? 'h-10 px-2 min-h-[44px] min-w-[44px]' 
                        : 'h-8 px-2'
                    }`}
                    type="button"
                  >
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    {!isMobile && (
                      <>
                        <span className="text-xs max-w-20 truncate">
                          {selectedCategoryName.replace(" Categories", "")}
                        </span>
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </>
                    )}
                    {isMobile && <ChevronDown className="h-3 w-3 ml-1" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border shadow-lg z-50">
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Enhanced Voice Input Button for Mobile */}
          {mobile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`absolute right-12 touch-manipulation min-h-[44px] min-w-[44px] p-0 ${
                isListening ? 'text-red-500 animate-pulse' : 'text-gray-500'
              }`}
              onClick={handleVoiceInput}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}

          <Button
            type="submit"
            className={`absolute right-2 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300 touch-manipulation ${
              isMobile 
                ? 'h-10 min-h-[44px] min-w-[44px]' 
                : 'h-8'
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

      {/* Enhanced Mode Description */}
      {isNicoleMode && (
        <div className="mt-2 text-center">
          <p className={`text-purple-600 font-medium ${
            isMobile ? 'text-sm' : 'text-xs'
          }`}>
            AI Mode Active - Nicole will help find perfect gifts
          </p>
        </div>
      )}

      {/* Product Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && !isNicoleMode && (
        <ul className={`absolute top-full left-0 right-0 z-50 bg-white shadow-lg border rounded-md mt-1 ${
          isMobile ? 'text-base' : 'text-sm'
        }`}>
          {suggestions.map((suggestion, idx) => (
            <li
              key={idx}
              className={`cursor-pointer hover:bg-purple-50 border-b border-gray-100 last:border-b-0 touch-manipulation ${
                isMobile ? 'p-4 min-h-[44px]' : 'p-3'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}

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
