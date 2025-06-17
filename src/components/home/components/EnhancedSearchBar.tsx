
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
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Sync search bar with URL parameters
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam && searchParam !== query) {
      setQuery(searchParam);
    }
  }, [searchParams]);

  useEffect(() => {
    setShowSuggestions(false);
  }, [location.pathname]);

  // Generate text-based suggestions (fast, no API calls)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const searchSuggestions = getSearchSuggestions(query);
      setSuggestions(searchSuggestions);
      setShowSuggestions(searchSuggestions.length > 0);
    }, 150); // Faster debounce for text suggestions

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const searchParams = new URLSearchParams();
      searchParams.set("search", query.trim());
      navigate(`/marketplace?${searchParams.toString()}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    const searchParams = new URLSearchParams();
    searchParams.set("search", suggestion);
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
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
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          onBlur={() => {
            // Delay hiding to allow clicks on suggestions
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />

        <Button
          type="submit"
          className="absolute right-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md px-3 py-1 text-sm font-medium h-7"
        >
          Search
        </Button>
      </div>

      {/* Simple text-based suggestions dropdown */}
      <SimpleSearchSuggestions
        query={query}
        suggestions={suggestions}
        isVisible={showSuggestions}
        onSuggestionClick={handleSuggestionClick}
        mobile={mobile}
      />
    </form>
  );
};

export default EnhancedSearchBar;
