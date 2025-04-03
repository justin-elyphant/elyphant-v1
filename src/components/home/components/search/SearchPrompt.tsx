
import React from "react";
import { Search } from "lucide-react";

interface SearchPromptProps {
  loading: boolean;
  searchTerm: string;
  onSelect: (value: string) => void;
}

const SearchPrompt = ({ loading, searchTerm, onSelect }: SearchPromptProps) => {
  if (loading) {
    return <div className="px-3 py-2">Searching...</div>;
  }
  
  if (searchTerm.trim().length <= 2) {
    return <div className="px-3 py-2">Enter at least 3 characters to search</div>;
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

export default SearchPrompt;
