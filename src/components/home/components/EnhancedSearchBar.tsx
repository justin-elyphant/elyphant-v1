
import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Command, CommandInput, CommandList, CommandEmpty } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useResultGrouping } from "@/hooks/useResultGrouping";
import ResultGroups from "./search/ResultGroups";

interface EnhancedSearchBarProps {
  onClose?: () => void;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const searchRef = useRef<HTMLDivElement>(null);

  const { debouncedSearchTerm, isSearching } = useDebounceSearch({ 
    initialValue: searchTerm, 
    delay: 300 
  });
  
  const { groupedResults } = useResultGrouping(debouncedSearchTerm, []);
  
  // Mock data for now - these would come from actual search services
  const filteredProducts = [];
  const friendsData = [
    { id: "friend-1", name: "Alex's Wishlist" },
    { id: "friend-2", name: "Sarah's Birthday" }
  ];
  const experiencesData = [
    { id: "exp-1", name: "Virtual Wine Tasting" },
    { id: "exp-2", name: "Spa Day Package" }
  ];
  const loading = isSearching;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchTerm(searchTerm);
    setIsOpen(searchTerm.length > 0);
  }, [searchTerm]);

  const handleSelect = (value: string) => {
    console.log("Selected:", value);
    setSearchTerm(value);
    setIsOpen(false);
    
    // Navigate to marketplace with search term
    navigate(`/marketplace?search=${encodeURIComponent(value)}`);
    
    // Close mobile menu if provided
    if (onClose) {
      onClose();
    }
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setIsOpen(value.length > 0);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <Command className="rounded-lg border shadow-md bg-white">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            placeholder="Search for gifts, products, friends..."
            value={searchTerm}
            onValueChange={handleInputChange}
            onFocus={() => searchTerm && setIsOpen(true)}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {isOpen && (
          <CommandList className="max-h-80 overflow-y-auto">
            {!debouncedSearchTerm ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Start typing to search...
              </div>
            ) : loading ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Searching...
              </div>
            ) : (
              <>
                <ResultGroups
                  searchTerm={debouncedSearchTerm}
                  groupedResults={groupedResults}
                  filteredProducts={filteredProducts}
                  friendsData={friendsData}
                  experiencesData={experiencesData}
                  onSelect={handleSelect}
                  loading={loading}
                />
                <CommandEmpty>
                  <div className="p-4 text-sm text-center">
                    <p className="text-muted-foreground mb-2">No results found for "{debouncedSearchTerm}"</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelect(debouncedSearchTerm)}
                    >
                      Search marketplace for "{debouncedSearchTerm}"
                    </Button>
                  </div>
                </CommandEmpty>
              </>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
};

export default EnhancedSearchBar;
