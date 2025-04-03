
import React from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchPromptProps {
  loading: boolean;
  searchTerm: string;
  onSelect: (value: string) => void;
  searchSuggestion?: string;
}

const SearchPrompt = ({ loading, searchTerm, onSelect, searchSuggestion }: SearchPromptProps) => {
  if (loading) {
    return <div className="py-6 text-center text-sm">Loading results...</div>;
  }

  // Show empty state for very short search terms
  if (!searchTerm || searchTerm.trim().length < 2) {
    return (
      <div className="py-6 text-center text-sm">
        Type to search for products, friends, or experiences
      </div>
    );
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
    <div className="py-6 text-center space-y-2">
      <div className="flex flex-col items-center gap-2">
        <Button variant="outline" className="w-full max-w-sm" onClick={handleClick}>
          <Search className="mr-2 h-4 w-4" />
          Search for "{searchTerm}"
        </Button>
        
        {searchSuggestion && (
          <Button variant="ghost" className="w-full max-w-sm" onClick={handleSuggestionClick}>
            <Search className="mr-2 h-4 w-4" />
            Did you mean "{searchSuggestion}"?
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchPrompt;
