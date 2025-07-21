
import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Package, Building2, UserPlus, Loader2 } from "lucide-react";
import { FilteredProfile } from "@/services/search/privacyAwareFriendSearch";
import { Product } from "@/types/product";

interface SearchResultsProps {
  shouldShowUnifiedSuggestions: boolean;
  shouldShowNicoleSuggestions: boolean;
  shouldShowNoResults: boolean;
  searchLoading: boolean;
  query: string;
  unifiedResults: {
    friends: FilteredProfile[];
    products: Product[];
    brands: string[];
  };
  suggestions: string[];
  onFriendSelect: (friend: FilteredProfile) => void;
  onProductSelect: (product: Product) => void;
  onBrandSelect: (brand: string) => void;
  onSendFriendRequest: (friendId: string, friendName: string) => void;
  onSuggestionClick: (suggestion: string) => void;
  mobile?: boolean;
  isNicoleMode: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  shouldShowUnifiedSuggestions,
  shouldShowNicoleSuggestions,
  shouldShowNoResults,
  searchLoading,
  query,
  unifiedResults,
  suggestions,
  onFriendSelect,
  onProductSelect,
  onBrandSelect,
  onSendFriendRequest,
  onSuggestionClick,
  mobile = false,
  isNicoleMode
}) => {
  console.log('🔍 [SearchResults] Rendering with:', {
    shouldShowUnifiedSuggestions,
    searchLoading,
    query,
    friendsCount: unifiedResults.friends.length,
    productsCount: unifiedResults.products.length,
    brandsCount: unifiedResults.brands.length
  });

  if (searchLoading) {
    return (
      <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg border z-50">
        <div className="p-4 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Searching...</span>
        </div>
      </div>
    );
  }

  if (shouldShowUnifiedSuggestions) {
    return (
      <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
        {/* Friends Section */}
        {unifiedResults.friends.length > 0 && (
          <div className="p-3 border-b">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">People</span>
            </div>
            <div className="space-y-2">
              {unifiedResults.friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onFriendSelect(friend)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={friend.profile_image} />
                      <AvatarFallback className="text-xs">
                        {friend.name?.substring(0, 2).toUpperCase() || 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{friend.name}</p>
                      <p className="text-xs text-gray-500">{friend.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {friend.connectionStatus === 'connected' && (
                      <Badge variant="secondary" className="text-xs">Connected</Badge>
                    )}
                    {friend.connectionStatus === 'pending' && (
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    )}
                    {friend.connectionStatus === 'none' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendFriendRequest(friend.id, friend.name);
                        }}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        {unifiedResults.products.length > 0 && (
          <div className="p-3 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Products</span>
            </div>
            <div className="space-y-2">
              {unifiedResults.products.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onProductSelect(product)}
                >
                  <div className="w-8 h-8 bg-gray-200 rounded flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.title || product.name}</p>
                    <p className="text-xs text-gray-500">${product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Brands Section */}
        {unifiedResults.brands.length > 0 && (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Brands</span>
            </div>
            <div className="space-y-1">
              {unifiedResults.brands.map((brand, index) => (
                <div
                  key={index}
                  className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onBrandSelect(brand)}
                >
                  <p className="text-sm">{brand}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (shouldShowNicoleSuggestions) {
    return (
      <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg border z-50">
        <div className="p-3">
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onSuggestionClick(suggestion)}
              >
                <p className="text-sm">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (shouldShowNoResults) {
    return (
      <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg border z-50">
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">No results found for "{query}"</p>
        </div>
      </div>
    );
  }

  return null;
};

export default SearchResults;
