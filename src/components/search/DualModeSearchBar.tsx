
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, Mic, Grid3X3, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchMode } from "@/hooks/useSearchMode";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NicoleConversationEngine from "@/components/ai/NicoleConversationEngine";

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
  const [isListening, setIsListening] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const nicoleDropdownRef = useRef<HTMLDivElement>(null);

  // Mock suggestions for demo - in real implementation, this would come from search history
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
      setShowNicoleDropdown(true);
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
      setShowNicoleDropdown(true);
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

  const handleModeToggle = () => {
    const newMode = isNicoleMode ? "search" : "nicole";
    setMode(newMode);
    setQuery("");
    setShowSuggestions(false);
    setShowNicoleDropdown(false);
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
        setShowNicoleDropdown(true);
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

  const searchIcon = isNicoleMode ? MessageCircle : Search;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant={!isNicoleMode ? "default" : "outline"}
          size="sm"
          onClick={handleModeToggle}
          className={`flex items-center gap-2 transition-all duration-200 ${
            !isNicoleMode 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "hover:bg-gray-50"
          }`}
        >
          <Search className="h-4 w-4" />
          Search Products
        </Button>
        <Button
          variant={isNicoleMode ? "default" : "outline"}
          size="sm"
          onClick={handleModeToggle}
          className={`flex items-center gap-2 transition-all duration-200 ${
            isNicoleMode 
              ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white" 
              : "hover:bg-gray-50"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Ask Nicole
          <Badge variant="secondary" className="ml-1 text-xs">AI</Badge>
        </Button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative flex items-center w-full" autoComplete="off">
        <div className="relative flex-1 flex items-center">
          <div className="absolute left-3 flex items-center">
            <searchIcon className={`h-4 w-4 ${isNicoleMode ? 'text-purple-500' : 'text-gray-400'}`} />
          </div>
          
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholderText}
            className={`pl-10 pr-32 ${mobile ? "text-base py-3 h-12" : ""} rounded-full border-gray-300 transition-all duration-200 ${
              isNicoleMode ? 'border-purple-300 focus:border-purple-500' : ''
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
            <div className="absolute right-20 flex items-center border-l border-gray-300 pl-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-gray-600 hover:text-gray-900"
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

          {/* Voice Input Button */}
          {mobile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`absolute right-12 h-8 w-8 p-0 ${isListening ? 'text-red-500' : 'text-gray-500'}`}
              onClick={handleVoiceInput}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}

          <Button
            type="submit"
            className={`absolute right-2 rounded-full px-3 py-1 text-xs font-semibold h-8 transition-all duration-200 ${
              isNicoleMode 
                ? "bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white"
                : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white"
            }`}
          >
            {isNicoleMode ? "Ask" : "Search"}
          </Button>
        </div>
      </form>

      {/* Product Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && !isNicoleMode && (
        <ul className="absolute top-full left-0 right-0 z-50 bg-white shadow-lg border rounded-md mt-1 text-sm">
          {suggestions.map((suggestion, idx) => (
            <li
              key={idx}
              className="p-3 cursor-pointer hover:bg-purple-50 border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      {/* Nicole Conversation Dropdown */}
      {showNicoleDropdown && isNicoleMode && (
        <div 
          ref={nicoleDropdownRef}
          className="absolute top-full left-0 right-0 z-50 bg-white shadow-lg border rounded-lg mt-1 max-h-96 overflow-hidden"
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
    </div>
  );
};

export default DualModeSearchBar;
