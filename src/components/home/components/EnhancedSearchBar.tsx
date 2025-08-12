
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface EnhancedSearchBarProps {
  mobile?: boolean;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ mobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
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
      } else if (!searchParam && query) {
        // Clear query if no search param
        setQuery("");
      }
    }
    
    // If there's a category but no search, clear the search bar
    if (categoryParam && !searchParam && query) {
      setQuery("");
    }
  }, [searchParams, location.pathname, location.search, query]);

  // Clear query when navigating to different pages
  useEffect(() => {
    // Reset query state when navigating away from marketplace
    if (!location.pathname.includes('/marketplace')) {
      setQuery("");
    }
  }, [location.pathname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const searchParams = new URLSearchParams();
      searchParams.set("search", query.trim());
      navigate(`/marketplace?${searchParams.toString()}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
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
          placeholder="Search brands, trending products, friends, and more..."
          className={`pl-10 pr-16 ${
            mobile 
              ? "text-base py-3 h-12 rounded-lg" 
              : "h-10 rounded-lg"
          } border-gray-300 focus:border-purple-500 focus:ring-purple-500`}
          value={query}
          onChange={handleInputChange}
        />

        <Button
          type="submit"
          className="absolute right-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md px-3 py-1 text-sm font-medium h-7"
        >
          Search
        </Button>
      </div>
    </form>
  );
};

export default EnhancedSearchBar;
