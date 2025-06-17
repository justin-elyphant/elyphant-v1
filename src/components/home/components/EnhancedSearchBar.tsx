
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { unifiedSearch } from "@/services/search/unifiedSearchService";
import { useAuth } from "@/contexts/auth";

interface EnhancedSearchBarProps {
  mobile?: boolean;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ mobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Sync search bar with URL parameters
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam && searchParam !== query) {
      setQuery(searchParam);
    }
  }, [searchParams]);

  useEffect(() => {
    setShowSuggestions(false);
  }, [location.pathname]);

  // Enhanced search using the unified search service
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length > 2) {
      setIsLoading(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          console.log(`Header search: Searching for "${query}" using Enhanced Zinc API`);
          const results = await unifiedSearch(query, {
            maxResults: 8,
            includeFriends: false,
            includeProducts: true,
            includeBrands: true,
            currentUserId: user?.id
          });

          // Combine product titles and brands for suggestions
          const productSuggestions = results.products.slice(0, 5).map(p => ({
            type: 'product',
            title: p.title,
            price: p.price,
            image: p.image
          }));

          const brandSuggestions = results.brands.slice(0, 3).map(brand => ({
            type: 'brand',
            title: brand,
            subtitle: 'Brand'
          }));

          const allSuggestions = [...productSuggestions, ...brandSuggestions];
          setSuggestions(allSuggestions);
          setShowSuggestions(allSuggestions.length > 0);
          
          console.log(`Header search: Found ${allSuggestions.length} suggestions for "${query}"`);
        } catch (error) {
          console.error('Header search error:', error);
          setShowSuggestions(false);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      setIsLoading(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, user?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    searchParams.set("search", query);
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: any) => {
    const searchQuery = suggestion.type === 'brand' ? suggestion.title : suggestion.title;
    setQuery(searchQuery);
    const searchParams = new URLSearchParams();
    searchParams.set("search", searchQuery);
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
  };

  return (
    <form
      className="relative flex items-center w-full"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      <div className="relative flex-1 flex items-center">
        <div className="absolute left-3 flex items-center">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <Input
          type="search"
          placeholder="Search friends, products, or brands"
          className={`pl-10 pr-16 ${
            mobile 
              ? "text-base py-3 h-12 rounded-lg" 
              : "h-10 rounded-lg"
          } border-gray-300 focus:border-purple-500 focus:ring-purple-500`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
        />

        <Button
          type="submit"
          className="absolute right-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md px-3 py-1 text-sm font-medium h-7"
        >
          Search
        </Button>
      </div>

      {/* Enhanced suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <ul className="absolute top-full left-0 right-0 z-50 bg-white shadow-lg border rounded-md mt-1 text-sm max-h-96 overflow-y-auto">
          {isLoading && (
            <li className="p-3 text-gray-500 text-center">
              Searching...
            </li>
          )}
          {!isLoading && suggestions.map((suggestion, idx) => (
            <li
              key={idx}
              className="p-3 cursor-pointer hover:bg-purple-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.type === 'product' && suggestion.image && (
                <img 
                  src={suggestion.image} 
                  alt={suggestion.title}
                  className="w-8 h-8 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              )}
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {suggestion.title}
                </div>
                {suggestion.type === 'product' && suggestion.price && (
                  <div className="text-sm text-gray-500">
                    ${suggestion.price}
                  </div>
                )}
                {suggestion.type === 'brand' && (
                  <div className="text-sm text-gray-500">
                    {suggestion.subtitle}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
};

export default EnhancedSearchBar;
