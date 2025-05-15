
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { allProducts } from "@/components/marketplace/zinc/data/mockProducts";

interface SearchBarProps {
  mobile?: boolean;
}

/**
 * Instantly filters products on marketplace navigation based on the entered term.
 * Uses mock data, does not call any APIs.
 */
const SearchBar: React.FC<SearchBarProps> = ({ mobile = false }) => {
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
      // Filter mock products for suggestions (only show top 5, by title)
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
    // Replace current search term in URL and go to marketplace
    navigate(`/marketplace?search=${encodeURIComponent(query)}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    navigate(`/marketplace?search=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
  };

  return (
    <form
      className={`relative flex items-center ${mobile ? "" : "w-full"}`}
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
      <Input
        type="search"
        placeholder="Search for gifts or products"
        className={`pl-10 ${mobile ? "text-base py-2" : ""} rounded-full`}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute top-10 left-0 right-0 z-30 bg-white shadow-lg border rounded-md mt-1 text-sm">
          {suggestions.map((suggestion, idx) => (
            <li
              key={idx}
              className="p-2 cursor-pointer hover:bg-purple-100"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      <button
        type="submit"
        className="absolute right-2 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white rounded-full px-3 py-1 text-xs font-semibold"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
