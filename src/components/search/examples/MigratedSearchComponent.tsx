import React from "react";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, User, Package, Star } from "lucide-react";

/**
 * Example component showing how to migrate from legacy search hooks to useUnifiedSearch
 * 
 * BEFORE (Legacy approach):
 * - Used multiple hooks: useSearchProducts, useSearchLogic, useSearchState
 * - Manual state management and error handling
 * - Separate API calls for different search types
 * - Complex caching logic
 * 
 * AFTER (Unified approach):
 * - Single useUnifiedSearch hook
 * - Automatic state management and error handling  
 * - Unified API with automatic routing to appropriate services
 * - Built-in caching and performance optimization
 */

interface MigratedSearchComponentProps {
  className?: string;
  placeholder?: string;
  onProductSelect?: (product: any) => void;
  onFriendSelect?: (friend: any) => void;
}

const MigratedSearchComponent: React.FC<MigratedSearchComponentProps> = ({
  className = "",
  placeholder = "Search friends, products, and brands...",
  onProductSelect,
  onFriendSelect
}) => {
  // ✅ NEW: Single hook replaces useSearchProducts + useSearchLogic + useSearchState
  const {
    query,
    results,
    isLoading,
    error,
    search,
    searchProducts,
    setQuery,
    clearSearch,
    searchHistory,
    cacheStats
  } = useUnifiedSearch({
    debounceMs: 300,
    maxResults: 20,
    autoSearch: false // Manual search on submit
  });

  // Handle search submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await search(query, {
        includeFriends: true,
        includeProducts: true, 
        includeBrands: true
      });
    }
  };

  // Handle input change with auto-suggestion
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Auto-search for suggestions if query is long enough
    if (value.length >= 2) {
      search(value, { maxResults: 5 });
    } else if (value.length === 0) {
      clearSearch();
    }
  };

  // Handle specific result selection
  const handleFriendClick = (friend: any) => {
    console.log('Friend selected:', friend);
    onFriendSelect?.(friend);
  };

  const handleProductClick = (product: any) => {
    console.log('Product selected:', product);
    onProductSelect?.(product);
  };

  const handleBrandClick = (brand: string) => {
    console.log('Brand selected:', brand);
    // Auto-search for products from this brand
    search(brand, { includeProducts: true, includeBrands: false, includeFriends: false });
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="pl-10 pr-20"
            disabled={isLoading}
          />
          {isLoading && (
            <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="absolute right-1 top-1/2 transform -translate-y-1/2"
            disabled={isLoading || !query.trim()}
          >
            Search
          </Button>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="mt-2 text-red-600 text-sm">
          Error: {error}
        </div>
      )}

      {/* Search Results */}
      {(results.friends.length > 0 || results.products.length > 0 || results.brands.length > 0) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto">
          
          {/* Friends Section */}
          {results.friends.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4" />
                Friends ({results.friends.length})
              </div>
              {results.friends.map((friend: any) => (
                <button
                  key={friend.id}
                  onClick={() => handleFriendClick(friend)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {friend.profile_image ? (
                      <img src={friend.profile_image} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <User className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{friend.first_name} {friend.last_name}</div>
                    {friend.email && <div className="text-sm text-gray-500">{friend.email}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Products Section */}
          {results.products.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Package className="h-4 w-4" />
                Products ({results.products.length})
              </div>
              {results.products.map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center gap-3"
                >
                  <img 
                    src={product.image || '/placeholder.svg'} 
                    alt="" 
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{product.title}</div>
                    <div className="text-green-600 font-medium">${product.price}</div>
                    {product.rating && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {product.rating}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Brands Section */}
          {results.brands.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Star className="h-4 w-4" />
                Brands ({results.brands.length})
              </div>
              {results.brands.map((brand: string) => (
                <button
                  key={brand}
                  onClick={() => handleBrandClick(brand)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  <div className="font-medium text-sm">{brand}</div>
                  <div className="text-xs text-gray-500">Search products from {brand}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {query.length >= 2 && !isLoading && results.total === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
          No results found for "{query}"
        </div>
      )}

      {/* Debug Info (Development only) */}
      {process.env.NODE_ENV === 'development' && cacheStats && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          Cache: {cacheStats.cacheSize} items | 
          Active: {cacheStats.activeRequests} requests |
          History: {searchHistory.length} searches
        </div>
      )}
    </div>
  );
};

export default MigratedSearchComponent;