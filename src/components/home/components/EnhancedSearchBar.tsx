
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { allProducts } from "@/components/marketplace/zinc/data/mockProducts";

interface EnhancedSearchBarProps {
  mobile?: boolean;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ mobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setShowSuggestions(false);
    setQuery("");
  }, [location.pathname]);

  useEffect(() => {
    if (query.length > 0) {
      const q = query.toLowerCase();
      const matches = allProducts
        .filter(p => p.title.toLowerCase().includes(q))
        .map(p => p.title)
        .slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    searchParams.set("search", query);
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
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
          placeholder="Search friends, products, or brands"
          className={`pl-10 pr-16 ${
            mobile 
              ? "text-base py-3 h-12 rounded-lg" 
              : "h-10 rounded-lg"
          } border-gray-300 focus:border-purple-500 focus:ring-purple-500`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
        />

        <Button
          type="submit"
          className="absolute right-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md px-3 py-1 text-sm font-medium h-7"
        >
          Search
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
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
    </form>
  );
};

export default EnhancedSearchBar;
