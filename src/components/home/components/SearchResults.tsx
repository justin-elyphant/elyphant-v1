
import React from "react";
import { Command, CommandList, CommandEmpty } from "@/components/ui/command";
import { useZincSearch } from "@/hooks/useZincSearch";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useResultGrouping } from "@/hooks/useResultGrouping";
import SearchPrompt from "./search/SearchPrompt";
import SearchGroup from "./search/SearchGroup";
import SearchFooter from "./search/SearchFooter";
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
  const { searchSuggestion } = useSearchSuggestions(searchTerm);
  
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
        
        {/* Render Apple MacBooks if applicable */}
        {searchTerm.toLowerCase().includes('macbook') && groupedResults.appleProducts?.length > 0 && (
          <SearchGroup 
            heading="Apple MacBooks" 
            items={groupedResults.appleProducts.map((product) => ({ 
              ...product,
              isTopSeller: true
            }))} 
            onSelect={handleSelect} 
          />
        )}
        
        {/* Render other laptop brands if applicable */}
        {searchTerm.toLowerCase().includes('macbook') && groupedResults.otherBrandProducts?.length > 0 && (
          <SearchGroup 
            heading="Other Laptops" 
            items={groupedResults.otherBrandProducts} 
            onSelect={handleSelect} 
          />
        )}
        
        {/* Render Padres hats if applicable */}
        {searchTerm.toLowerCase().includes('padres') && groupedResults.actualHats?.length > 0 && (
          <SearchGroup 
            heading="Padres Hats" 
            items={groupedResults.actualHats} 
            onSelect={handleSelect} 
          />
        )}
        
        {/* Render other Padres items if applicable */}
        {searchTerm.toLowerCase().includes('padres') && groupedResults.otherProducts?.length > 0 && (
          <SearchGroup 
            heading="Other Padres Items" 
            items={groupedResults.otherProducts} 
            onSelect={handleSelect} 
          />
        )}
        
        {/* Render top sellers for other searches */}
        {!searchTerm.toLowerCase().includes('macbook') && 
         !searchTerm.toLowerCase().includes('padres') && 
         groupedResults.topSellers?.length > 0 && (
          <SearchGroup 
            heading="Top Sellers" 
            items={groupedResults.topSellers.map((product) => ({ 
              ...product,
              isTopSeller: true
            }))} 
            onSelect={handleSelect} 
          />
        )}
        
        {/* Render other products for other searches */}
        {!searchTerm.toLowerCase().includes('macbook') && 
         !searchTerm.toLowerCase().includes('padres') && 
         groupedResults.otherProducts?.length > 0 && (
          <SearchGroup 
            heading="More Products" 
            items={groupedResults.otherProducts} 
            onSelect={handleSelect} 
          />
        )}
        
        {/* Render local store products if available */}
        {filteredProducts.length > 0 && (
          <SearchGroup 
            heading="Store Products" 
            items={filteredProducts.map((product) => ({ 
              id: `local-${product.id}`,
              name: product.name,
              image: product.image,
              rating: product.rating,
              reviewCount: product.reviewCount,
              originalProduct: product // Store the original product data
            }))} 
            onSelect={handleSelect} 
          />
        )}
        
        {/* Additional groups for friends and experiences */}
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
