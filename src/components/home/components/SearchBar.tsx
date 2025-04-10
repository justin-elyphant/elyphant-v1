
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import SearchResults from "./SearchResults";
import { hasValidZincToken } from "@/components/marketplace/zinc/zincCore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showTokenAlert, setShowTokenAlert] = useState(false);
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
      // Check if token is missing when user initiates search
      if (!hasValidZincToken() && !showTokenAlert) {
        setShowTokenAlert(true);
      }
      
      // Ensure we navigate to marketplace with the search term
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
      
      // Check if token is missing when user selects an item
      if (!hasValidZincToken() && !showTokenAlert) {
        setShowTokenAlert(true);
      }
      
      // Always navigate to the marketplace with the search term
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
  
  // Go to Trunkline portal
  const goToTrunkline = () => {
    navigate("/trunkline");
    setShowTokenAlert(false);
  };
  
  // Dismiss the token alert
  const dismissAlert = () => {
    setShowTokenAlert(false);
  };

  return (
    <div className="w-full">
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
        
        {showTokenAlert && !hasValidZincToken() && (
          <Alert className="mt-2 bg-amber-50 border-amber-200 text-amber-800">
            <AlertDescription className="flex justify-between items-center">
              <span>Using mock search results. Add a Zinc API token for real product search.</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={dismissAlert}>Dismiss</Button>
                <Button size="sm" variant="default" onClick={goToTrunkline}>Go to Trunkline</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
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
    </div>
  );
};

export default SearchBar;
