import React from "react";
import { Command, CommandInput, CommandList, CommandEmpty } from "@/components/ui/command";
import { useZincSearch } from "@/hooks/useZincSearch";
import SearchPrompt from "./search/SearchPrompt";
import SearchGroup from "./search/SearchGroup";
import SearchFooter from "./search/SearchFooter";

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

  // Handle keyboard navigation and Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      onItemSelect(searchTerm);
    }
  };

  // Static mock data for friends and experiences
  const friendsData = [
    { id: "friend-1", name: "Alex's Wishlist" },
    { id: "friend-2", name: "Sarah's Birthday" }
  ];

  const experiencesData = [
    { id: "exp-1", name: "Virtual Wine Tasting" },
    { id: "exp-2", name: "Spa Day Package" },
    { id: "exp-3", name: "Easter Egg Hunt" }
  ];

  const handleSelect = (value: string) => {
    if (value) {
      onItemSelect(value);
    }
  };

  // This handler ensures no auto-highlighting
  const handleInputValueChange = (value: string) => {
    // We pass the value up to parent components
    onSearchTermChange(value);
  };

  // Calculate search suggestion based on search term
  const getSearchSuggestion = () => {
    if (!searchTerm || searchTerm.trim().length < 2) return "";
    
    const term = searchTerm.toLowerCase().trim();
    
    // Common search suggestions
    const suggestions: Record<string, string> = {
      "n": "nike shoes",
      "ni": "nike shoes",
      "nik": "nike shoes",
      "d": "dallas cowboys",
      "da": "dallas cowboys",
      "dal": "dallas cowboys",
      "ip": "iphone",
      "iph": "iphone",
      "s": "samsung galaxy",
      "sa": "samsung galaxy",
      "sam": "samsung galaxy",
      "p": "playstation",
      "pl": "playstation",
      "x": "xbox",
      "xb": "xbox"
    };
    
    // Check if we have an exact match in our suggestions
    if (suggestions[term]) {
      return suggestions[term];
    }
    
    // Otherwise, return the original search term
    return searchTerm;
  };

  const searchSuggestion = getSearchSuggestion();

  return (
    <Command onKeyDown={handleKeyDown}>
      <CommandInput 
        placeholder="Search products, friends, or experiences..." 
        value={searchTerm}
        onValueChange={handleInputValueChange}
        // Fix: Prevent auto-focusing the input which causes unwanted selection
        autoFocus={false}
        className="cursor-text"
        // Fix: Additional props to prevent browser auto-behavior
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      <CommandList>
        <CommandEmpty>
          <SearchPrompt 
            loading={loading} 
            searchTerm={searchTerm} 
            onSelect={handleSelect} 
            searchSuggestion={searchSuggestion !== searchTerm ? searchSuggestion : ""}
          />
        </CommandEmpty>
        
        <SearchGroup 
          heading="Amazon Products" 
          items={zincResults.map((product) => ({ 
            id: `zinc-${product.id || product.product_id || Math.random().toString()}`,
            title: product.title,
            name: product.title
          }))} 
          onSelect={handleSelect} 
        />
        
        <SearchGroup 
          heading="Store Products" 
          items={filteredProducts.map((product) => ({ 
            id: `local-${product.id}`,
            name: product.name,
          }))} 
          onSelect={handleSelect} 
        />
        
        {searchTerm.trim().length > 1 && !loading && (
          <>
            <SearchGroup 
              heading="Friends" 
              items={friendsData} 
              onSelect={handleSelect} 
            />
            
            <SearchGroup 
              heading="Experiences" 
              items={experiencesData} 
              onSelect={handleSelect} 
            />
          </>
        )}
        
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
