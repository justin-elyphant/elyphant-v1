
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SearchResults from "./SearchResults";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get search term from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [location.search]);
  
  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
    }
  };

  // Simple input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Open popover if we have text, close if empty
    if (value.trim()) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  };

  // Handle selecting an item from search results
  const handleSearchItemSelect = (value: string) => {
    if (value.trim()) {
      setSearchTerm(value);
      setIsSearchOpen(false);
      navigate(`/marketplace?search=${encodeURIComponent(value.trim())}`);
    }
  };

  // Clear the search input
  const handleClearSearch = () => {
    setSearchTerm("");
    setIsSearchOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          ref={inputRef}
          type="text"
          placeholder="Search products, brands, friends, or experiences..." 
          className="pl-10 w-full"
          value={searchTerm}
          onChange={handleInputChange}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        {searchTerm.length > 0 && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4"
            onClick={handleClearSearch}
          >
            &times;
          </button>
        )}
      </div>
      
      {isSearchOpen && searchTerm.trim() && (
        <div className="absolute z-50 w-[calc(100vw-2rem)] sm:w-[450px] mt-1 bg-popover rounded-md border shadow-md">
          <SearchResults 
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onItemSelect={handleSearchItemSelect}
          />
        </div>
      )}
    </form>
  );
};

export default SearchBar;
