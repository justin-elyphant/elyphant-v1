
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SearchResults from "./SearchResults";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
      setIsSearchOpen(false);
    }
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    // Open the search results popover when the user starts typing
    if (value.trim().length > 0 && !isSearchOpen) {
      setIsSearchOpen(true);
    }
  };

  const handleSearchItemSelect = (value: string) => {
    setSearchTerm(value);
    navigate(`/marketplace?search=${encodeURIComponent(value)}`);
    setIsSearchOpen(false);
  };

  return (
    <div className="w-full">
      <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search products, friends, or experiences..." 
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => handleSearchTermChange(e.target.value)}
              onClick={() => setIsSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                }
              }}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[calc(100vw-2rem)] sm:w-[450px] z-50" align="start">
          <SearchResults 
            searchTerm={searchTerm}
            onSearchTermChange={handleSearchTermChange}
            onItemSelect={handleSearchItemSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SearchBar;
