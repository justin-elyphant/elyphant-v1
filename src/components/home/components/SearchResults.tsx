
import React from "react";
import { Command, CommandList, CommandEmpty } from "@/components/ui/command";
import { useZincSearch } from "@/hooks/useZincSearch";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useResultGrouping } from "@/hooks/useResultGrouping";
import SearchPrompt from "./search/SearchPrompt";
import SearchFooter from "./search/SearchFooter";
import ResultGroups from "./search/ResultGroups";
import { useNavigate } from "react-router-dom";

interface SearchResultsProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onItemSelect: (value: string) => void;
}

const SearchResults = ({ 
  searchTerm, 
  onSearchTermChange, 
  onItemSelect 
}: SearchResultsProps) => {
  const { loading, zincResults, filteredProducts, hasResults } = useZincSearch(searchTerm);
  const navigate = useNavigate();
  
  // Get search suggestions for the current term
  const { suggestions } = useSearchSuggestions(searchTerm);
  
  // Get grouped results based on search term and results
  const { groupedResults } = useResultGrouping(searchTerm, zincResults);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      onItemSelect(searchTerm);
    }
  };

  // Handle item selection - navigate to marketplace with search term
  const handleSelect = (value: string) => {
    if (value) {
      onItemSelect(value);
      // Navigate to marketplace with search query
      navigate(`/marketplace?search=${encodeURIComponent(value)}`);
    }
  };

  // More realistic friend data based on wishlist
  const friendsData = [
    { id: "friend-1", name: "Alex's Wishlist" },
    { id: "friend-2", name: "Sarah's Birthday" }
  ];

  // More realistic experiences data
  const experiencesData = [
    { id: "exp-1", name: "Virtual Wine Tasting" },
    { id: "exp-2", name: "Spa Day Package" },
    { id: "exp-3", name: "San Diego Padres Game" }
  ];

  // Use the first suggestion as the search suggestion, or empty string if none
  const searchSuggestion = suggestions.length > 0 ? suggestions[0].text : "";

  return (
    <Command onKeyDown={handleKeyDown}>
      <CommandList>
        <CommandEmpty>
          <SearchPrompt 
            loading={loading} 
            searchTerm={searchTerm} 
            onSelect={handleSelect} 
            searchSuggestion={searchSuggestion !== searchTerm ? searchSuggestion : ""}
          />
        </CommandEmpty>
        
        {/* Render all result groups */}
        <ResultGroups 
          searchTerm={searchTerm}
          groupedResults={groupedResults}
          filteredProducts={filteredProducts}
          friendsData={friendsData}
          experiencesData={experiencesData}
          onSelect={handleSelect}
          loading={loading}
        />
        
        <SearchFooter 
          searchTerm={searchTerm}
          hasResults={hasResults}
          isLoading={loading}
          onSelect={handleSelect}
          searchSuggestion={searchSuggestion !== searchTerm ? searchSuggestion : ""}
        />
      </CommandList>
    </Command>
  );
};

export default SearchResults;
