
import React from "react";
import { Command, CommandList, CommandEmpty } from "@/components/ui/command";
import { useZincSearch } from "@/hooks/useZincSearch";
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

  // Improved search suggestion logic
  const getSearchSuggestion = () => {
    if (!searchTerm || searchTerm.trim().length < 2) return "";
    
    const term = searchTerm.toLowerCase().trim();
    
    // Enhanced suggestions based on partial matches
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
      "xb": "xbox",
      "he": "headphones",
      "hea": "headphones",
      "wat": "apple watch",
      "pad": "ipad",
      "san": "san diego padres",
      "san d": "san diego padres",
      "san di": "san diego padres",
      "can": "scented candle",
      "47": "47 brand cap",
      "47 b": "47 brand cap"
    };
    
    if (suggestions[term]) {
      return suggestions[term];
    }
    
    return searchTerm;
  };

  const searchSuggestion = getSearchSuggestion();
  
  // Sort products by rating/review count to identify top sellers
  const sortedZincResults = [...zincResults].sort((a, b) => {
    const aScore = (a.rating || 0) * (a.review_count || 0);
    const bScore = (b.rating || 0) * (b.review_count || 0);
    return bScore - aScore;
  });
  
  // Identify top sellers (top 30% of results)
  const topSellerCount = Math.max(1, Math.ceil(sortedZincResults.length * 0.3));
  const topSellers = sortedZincResults.slice(0, topSellerCount);
  const otherProducts = sortedZincResults.slice(topSellerCount);

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
        
        {topSellers.length > 0 && (
          <SearchGroup 
            heading="Top Sellers" 
            items={topSellers.map((product) => ({ 
              id: `top-${product.id || product.product_id || Math.random().toString()}`,
              title: product.title,
              name: product.title,
              image: product.image,
              isTopSeller: true,
              rating: product.rating || product.stars,
              reviewCount: product.review_count || product.num_reviews,
              originalProduct: product // Store the original product data
            }))} 
            onSelect={handleSelect} 
          />
        )}
        
        {otherProducts.length > 0 && (
          <SearchGroup 
            heading="More Products" 
            items={otherProducts.map((product) => ({ 
              id: `other-${product.id || product.product_id || Math.random().toString()}`,
              title: product.title,
              name: product.title,
              image: product.image,
              rating: product.rating || product.stars,
              reviewCount: product.review_count || product.num_reviews,
              originalProduct: product // Store the original product data
            }))} 
            onSelect={handleSelect} 
          />
        )}
        
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
