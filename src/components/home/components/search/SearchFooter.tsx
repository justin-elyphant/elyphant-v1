
import React from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchFooterProps {
  searchTerm: string;
  hasResults: boolean;
  isLoading: boolean;
  onSelect: (value: string) => void;
  searchSuggestion?: string;
}

const SearchFooter = ({ 
  searchTerm, 
  hasResults, 
  isLoading, 
  onSelect,
  searchSuggestion
}: SearchFooterProps) => {
  // Don't show for empty or very short search terms
  if (!searchTerm || searchTerm.trim().length < 2 || isLoading) {
    return null;
  }

  const handleClick = () => {
    onSelect(searchTerm);
  };

  const handleSuggestionClick = () => {
    if (searchSuggestion) {
      onSelect(searchSuggestion);
    }
  };

  return (
    <div className="border-t p-2">
      <div className="flex flex-col gap-2">
        <Button variant="outline" className="w-full" onClick={handleClick}>
          <Search className="mr-2 h-4 w-4" />
          {hasResults ? "See all results for" : "Search for"} "{searchTerm}"
        </Button>
        
        {searchSuggestion && (
          <Button variant="ghost" className="w-full" onClick={handleSuggestionClick}>
            <Search className="mr-2 h-4 w-4" />
            Did you mean "{searchSuggestion}"?
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchFooter;
