
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import SearchResults from "./SearchResults";
import { hasValidZincToken } from "@/components/marketplace/zinc/zincCore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showTokenAlert, setShowTokenAlert] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInProgressRef = useRef(false);
  const isMobile = useIsMobile();
  
  // Get search term from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [location.search]);
  
  // Handle form submission with debouncing
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple rapid searches
    if (searchInProgressRef.current) return;
    
    if (searchTerm.trim()) {
      searchInProgressRef.current = true;
      
      // Check if token is missing when user initiates search
      if (!hasValidZincToken() && !showTokenAlert) {
        setShowTokenAlert(true);
      }
      
      // Ensure we navigate to marketplace with the search term
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
      
      // Reset search in progress after a short delay
      setTimeout(() => {
        searchInProgressRef.current = false;
      }, 500);
    }
  };

  // Simple input change handler with debounce for search popover
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
    // Prevent multiple rapid searches
    if (searchInProgressRef.current) return;
    
    if (value.trim()) {
      searchInProgressRef.current = true;
      
      setSearchTerm(value);
      setIsSearchOpen(false);
      
      // Check if token is missing when user selects an item
      if (!hasValidZincToken() && !showTokenAlert) {
        setShowTokenAlert(true);
      }
      
      console.log("Navigating to marketplace with search:", value.trim());
      // Always navigate to the marketplace with the search term
      navigate(`/marketplace?search=${encodeURIComponent(value.trim())}`);
      
      // Reset search in progress after a short delay
      setTimeout(() => {
        searchInProgressRef.current = false;
      }, 500);
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
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            ref={inputRef}
            type="text"
            placeholder={isMobile ? "Search products..." : "Search products, brands, friends, or experiences..."} 
            className="pl-8 w-full h-9 md:h-10"
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>
        
        {showTokenAlert && !hasValidZincToken() && (
          <Alert className="mt-2 bg-amber-50 border-amber-200 text-amber-800">
            <AlertDescription className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2">
              <span className="text-sm">Using mock search results. Add a Zinc API token for real product search.</span>
              <div className="flex gap-2 w-full xs:w-auto">
                <Button size="sm" variant="outline" onClick={dismissAlert} className="flex-1 xs:flex-auto text-xs py-1">Dismiss</Button>
                <Button size="sm" variant="default" onClick={goToTrunkline} className="flex-1 xs:flex-auto text-xs py-1">Go to Trunkline</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {isSearchOpen && searchTerm.trim() && (
          <div className="absolute z-50 w-[calc(100vw-2rem)] xs:w-[100%] mt-1 bg-popover rounded-md border shadow-md">
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
