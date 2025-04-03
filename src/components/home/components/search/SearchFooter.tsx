
import React from "react";
import { Search } from "lucide-react";

interface SearchFooterProps {
  searchTerm: string;
  hasResults: boolean;
  isLoading: boolean;
  onSelect: (value: string) => void;
}

const SearchFooter = ({ searchTerm, hasResults, isLoading, onSelect }: SearchFooterProps) => {
  if (hasResults || isLoading || searchTerm.trim().length <= 2) {
    return null;
  }

  return (
    <div 
      className="text-blue-600 hover:text-blue-800 px-3 py-2 cursor-pointer flex items-center"
      onClick={() => onSelect(searchTerm)}
    >
      <Search className="mr-2 h-4 w-4" />
      Search for "{searchTerm}" in marketplace
    </div>
  );
};

export default SearchFooter;
