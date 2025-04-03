
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
  
  // Initialize search term from URL on mount or location change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [location.search]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log(`SearchBar: Navigating to marketplace with search term "${searchTerm}"`);
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Open the search results popover when the user starts typing
    if (value.trim().length > 0 && !isSearchOpen) {
      setIsSearchOpen(true);
    } else if (value.trim().length === 0) {
      setIsSearchOpen(false);
    }
  };

  const handleSearchItemSelect = (value: string) => {
    if (!value.trim()) return;
    
    setSearchTerm(value);
    console.log(`SearchBar: Selected search item "${value}"`);
    setIsSearchOpen(false);
    
    // Brief timeout to ensure the UI updates before navigating
    setTimeout(() => {
      navigate(`/marketplace?search=${encodeURIComponent(value.trim())}`);
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission behavior
      handleSearch(e as unknown as React.FormEvent);
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const handlePopoverOpenChange = (open: boolean) => {
    // Only allow opening the popover if we have a search term
    if (open && searchTerm.trim().length === 0) {
      return;
    }
    setIsSearchOpen(open);
    
    // Focus the input when the popover opens
    if (open && inputRef.current) {
      // Use setTimeout to ensure the focus happens after React's rendering cycle
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Place cursor at the end
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 0);
    }
  };

  const handleInputClick = () => {
    if (searchTerm.trim().length > 0) {
      setIsSearchOpen(true);
      
      // Make sure the cursor is at the end of the text and no text is selected
      if (inputRef.current) {
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }
  };

  const handleClearButtonClick = () => {
    setSearchTerm("");
    setIsSearchOpen(false);
    
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <Popover open={isSearchOpen} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              ref={inputRef}
              placeholder="Search products, friends, or experiences..." 
              className="pl-10 w-full"
              value={searchTerm}
              onChange={handleSearchTermChange}
              onClick={handleInputClick}
              onKeyDown={handleKeyDown}
            />
            {searchTerm.length > 0 && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4"
                onClick={handleClearButtonClick}
              >
                &times;
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[calc(100vw-2rem)] sm:w-[450px] z-50" align="start">
          <SearchResults 
            searchTerm={searchTerm}
            onSearchTermChange={(value) => setSearchTerm(value)}
            onItemSelect={handleSearchItemSelect}
          />
        </PopoverContent>
      </Popover>
    </form>
  );
};

export default SearchBar;
