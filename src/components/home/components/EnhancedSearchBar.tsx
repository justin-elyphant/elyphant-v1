
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid3X3, ChevronDown } from "lucide-react";
import { allProducts } from "@/components/marketplace/zinc/data/mockProducts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

interface EnhancedSearchBarProps {
  mobile?: boolean;
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

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ mobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
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
    if (selectedCategory) {
      searchParams.set("category", selectedCategory);
    }
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    const searchParams = new URLSearchParams();
    searchParams.set("search", suggestion);
    if (selectedCategory) {
      searchParams.set("category", selectedCategory);
    }
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
  };

  const selectedCategoryName = categories.find(cat => cat.value === selectedCategory)?.name || "All Categories";

  return (
    <form
      className={`relative flex items-center w-full`}
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      {/* Integrated search bar with category selector */}
      <div className="relative flex-1 flex items-center">
        <div className="absolute left-3 flex items-center">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <Input
          type="search"
          placeholder="Search friends, products, or brands"
          className={`pl-10 pr-32 ${mobile ? "text-base py-3 h-12" : ""} rounded-full border-gray-300`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
        />

        {/* Category selector integrated into search bar */}
        <div className="absolute right-12 flex items-center border-l border-gray-300 pl-2">
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

        <Button
          type="submit"
          className="absolute right-2 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white rounded-full px-3 py-1 text-xs font-semibold h-8"
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
