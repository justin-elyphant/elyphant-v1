
import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { 
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { searchProducts } from "@/components/marketplace/zinc/productService";
import { useProducts } from "@/contexts/ProductContext";

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
  const [loading, setLoading] = useState(false);
  const [zincResults, setZincResults] = useState<any[]>([]);
  const { products } = useProducts();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchRequestIdRef = useRef<number>(0);
  const previousSearchTermRef = useRef<string>("");

  // Search Zinc API when searchTerm changes with improved debouncing
  useEffect(() => {
    // Don't trigger search if term is too short or hasn't changed
    if (searchTerm.trim().length <= 2 || searchTerm === previousSearchTermRef.current) {
      return;
    }
    
    // Update previous search term
    previousSearchTermRef.current = searchTerm;
    
    setLoading(true);
    
    // Clear any pending timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Create a unique ID for this search request
    const currentRequestId = ++searchRequestIdRef.current;
    
    // Set a timeout to avoid excessive API calls
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log("Searching for products with term:", searchTerm);
        // Only proceed if this is still the most recent request
        if (currentRequestId === searchRequestIdRef.current) {
          const results = await searchProducts(searchTerm);
          console.log("Search results:", results);
          // Only update state if this is still the most recent request
          if (currentRequestId === searchRequestIdRef.current) {
            setZincResults(results.slice(0, 5)); // Limit to 5 results
          }
        }
      } catch (error) {
        console.error("Error searching Zinc API:", error);
      } finally {
        if (currentRequestId === searchRequestIdRef.current) {
          setLoading(false);
        }
      }
    }, 600); // 600ms debounce - slightly longer to prevent frequent calls
    
    // Cleanup timeout on unmount or when searchTerm changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Get local store products that match searchTerm
  const filteredProducts = searchTerm.trim().length <= 2 ? [] : 
    products
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .slice(0, 5); // Limit to 5 results

  // Determine if we have any results to show
  const hasResults = zincResults.length > 0 || filteredProducts.length > 0;

  return (
    <Command>
      <CommandInput 
        placeholder="Search products, friends, or experiences..." 
        value={searchTerm}
        onValueChange={onSearchTermChange} 
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Searching..." : "No results found."}
        </CommandEmpty>
        
        {zincResults.length > 0 && (
          <CommandGroup heading="Amazon Products">
            {zincResults.map((product, index) => (
              <CommandItem 
                key={`zinc-${index}`} 
                onSelect={() => onItemSelect(product.title)}
              >
                <Search className="mr-2 h-4 w-4" />
                {product.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {filteredProducts.length > 0 && (
          <CommandGroup heading="Store Products">
            {filteredProducts.map((product) => (
              <CommandItem 
                key={`local-${product.id}`}
                onSelect={() => onItemSelect(product.name)}
              >
                <Search className="mr-2 h-4 w-4" />
                {product.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {searchTerm.trim().length > 2 && (
          <>
            <CommandGroup heading="Friends">
              <CommandItem onSelect={() => onItemSelect("Alex's Wishlist")}>
                <Search className="mr-2 h-4 w-4" />
                Alex's Wishlist
              </CommandItem>
              <CommandItem onSelect={() => onItemSelect("Sarah's Birthday")}>
                <Search className="mr-2 h-4 w-4" />
                Sarah's Birthday
              </CommandItem>
            </CommandGroup>
            
            <CommandGroup heading="Experiences">
              <CommandItem onSelect={() => onItemSelect("Virtual Wine Tasting")}>
                <Search className="mr-2 h-4 w-4" />
                Virtual Wine Tasting
              </CommandItem>
              <CommandItem onSelect={() => onItemSelect("Spa Day Package")}>
                <Search className="mr-2 h-4 w-4" />
                Spa Day Package
              </CommandItem>
              <CommandItem onSelect={() => onItemSelect("Easter Egg Hunt")}>
                <Search className="mr-2 h-4 w-4" />
                Easter Egg Hunt
              </CommandItem>
            </CommandGroup>
          </>
        )}
        
        {!hasResults && searchTerm.trim().length > 2 && !loading && (
          <CommandItem 
            onSelect={() => onItemSelect(searchTerm)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Search className="mr-2 h-4 w-4" />
            Search for "{searchTerm}" in marketplace
          </CommandItem>
        )}
      </CommandList>
    </Command>
  );
};

export default SearchResults;
