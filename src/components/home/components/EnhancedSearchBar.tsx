
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import SimpleSearchSuggestions from "./SimpleSearchSuggestions";
import { getSearchSuggestions } from "@/services/search/searchSuggestionsService";

interface EnhancedSearchBarProps {
  mobile?: boolean;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ mobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const previousSearchParam = useRef<string | null>(null);

  // Enhanced sync with URL parameters - listen for all changes
  useEffect(() => {
    const searchParam = searchParams.get("search");
    const categoryParam = searchParams.get("category");
    
    // Only update if the search param actually changed
    if (searchParam !== previousSearchParam.current) {
      previousSearchParam.current = searchParam;
      
      if (searchParam && searchParam !== query) {
        setQuery(searchParam);
        // Reset user interaction flags for URL-populated queries
        setUserInteracted(false);
        setIsTyping(false);
        setShowSuggestions(false);
      } else if (!searchParam && query) {
        // Clear query if no search param
        setQuery("");
        setUserInteracted(false);
        setIsTyping(false);
        setShowSuggestions(false);
      }
    }
    
    // If there's a category but no search, clear the search bar
    if (categoryParam && !searchParam && query) {
      setQuery("");
      setUserInteracted(false);
      setIsTyping(false);
      setShowSuggestions(false);
    }
  }, [searchParams, location.pathname, location.search, query]);

  // Hide suggestions when navigating to different pages
  useEffect(() => {
    setShowSuggestions(false);
    setUserInteracted(false);
    setIsTyping(false);
  }, [location.pathname]);

  // Generate simple text-based suggestions only when user actively types
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      // Only show suggestions if user is actively typing (not from URL changes)
      if (userInteracted && isTyping && query.length > 0) {
        const searchSuggestions = getSearchSuggestions(query);
        setSuggestions(searchSuggestions);
        setShowSuggestions(searchSuggestions.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 150);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, userInteracted, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const searchParams = new URLSearchParams();
      searchParams.set("search", query.trim());
      navigate(`/marketplace?${searchParams.toString()}`);
      setShowSuggestions(false);
      setUserInteracted(false);
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    const searchParams = new URLSearchParams();
    searchParams.set("search", suggestion);
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
    setUserInteracted(false);
    setIsTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setUserInteracted(true);
    setIsTyping(true); // Mark as actively typing
  };

  const handleInputFocus = () => {
    setUserInteracted(true);
    // Only show suggestions if user has been typing and we have suggestions
    if (isTyping && suggestions.length > 0 && query.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow clicks on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setIsTyping(false);
    }, 200);
  };

  return (
    <form
      className="relative flex items-center w-full"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      <div className="relative flex-1 flex items-center">
        <div className="absolute left-3 flex items-center">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <Input
          type="search"
          placeholder="Search for products, brands, or categories"
          className={`pl-10 pr-16 ${
            mobile 
              ? "text-base py-3 h-12 rounded-lg" 
              : "h-10 rounded-lg"
          } border-gray-300 focus:border-purple-500 focus:ring-purple-500`}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />

        <Button
          type="submit"
          className="absolute right-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md px-3 py-1 text-sm font-medium h-7"
        >
          Search
        </Button>
      </div>

      {/* Simple text-based suggestions dropdown - only show when user is actively typing */}
      <SimpleSearchSuggestions
        query={query}
        suggestions={suggestions}
        isVisible={showSuggestions && userInteracted && isTyping}
        onSuggestionClick={handleSuggestionClick}
        mobile={mobile}
      />
    </form>
  );
};

export default EnhancedSearchBar;
