
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
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Enhanced sync with URL parameters - listen for all changes
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam && searchParam !== query) {
      setQuery(searchParam);
      // Don't show suggestions for URL-populated queries
      setUserInteracted(false);
      setShowSuggestions(false);
    } else if (!searchParam && query) {
      // Clear query if no search param
      setQuery("");
      setUserInteracted(false);
      setShowSuggestions(false);
    }
  }, [searchParams, location.pathname, location.search]);

  // Hide suggestions when navigating to different pages
  useEffect(() => {
    setShowSuggestions(false);
    setUserInteracted(false);
  }, [location.pathname]);

  // Generate simple text-based suggestions only when user interacts
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (userInteracted && query.length > 0) {
        const searchSuggestions = getSearchSuggestions(query);
        setSuggestions(searchSuggestions);
        // Only show suggestions if we have a query, suggestions, and user interacted
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
  }, [query, userInteracted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const searchParams = new URLSearchParams();
      searchParams.set("search", query.trim());
      navigate(`/marketplace?${searchParams.toString()}`);
      setShowSuggestions(false);
      setUserInteracted(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    const searchParams = new URLSearchParams();
    searchParams.set("search", suggestion);
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
    setUserInteracted(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setUserInteracted(true); // Mark as user interaction
  };

  const handleInputFocus = () => {
    setUserInteracted(true); // Mark as user interaction
    if (suggestions.length > 0 && query.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow clicks on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
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

      {/* Simple text-based suggestions dropdown - only show on user interaction */}
      <SimpleSearchSuggestions
        query={query}
        suggestions={suggestions}
        isVisible={showSuggestions && userInteracted}
        onSuggestionClick={handleSuggestionClick}
        mobile={mobile}
      />
    </form>
  );
};

export default EnhancedSearchBar;
