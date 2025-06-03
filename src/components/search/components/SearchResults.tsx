
import React from "react";
import SearchSuggestions from "../SearchSuggestions";
import UnifiedSearchSuggestions from "../UnifiedSearchSuggestions";
import { FriendSearchResult } from "@/services/search/friendSearchService";
import { ZincProduct } from "@/components/marketplace/zinc/types";

interface SearchResultsProps {
  shouldShowUnifiedSuggestions: boolean;
  shouldShowNicoleSuggestions: boolean;
  shouldShowNoResults: boolean;
  searchLoading: boolean;
  query: string;
  unifiedResults: {
    friends: FriendSearchResult[];
    products: ZincProduct[];
    brands: string[];
  };
  suggestions: string[];
  onFriendSelect: (friend: FriendSearchResult) => void;
  onProductSelect: (product: ZincProduct) => void;
  onBrandSelect: (brand: string) => void;
  onSendFriendRequest: (friendId: string, friendName: string) => void;
  onSuggestionClick: (suggestion: string) => void;
  mobile: boolean;
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
  mobile,
  isNicoleMode
}) => {
  return (
    <>
      {/* Loading indicator */}
      {searchLoading && query.length > 1 && !isNicoleMode && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white shadow-lg border rounded-md mt-1 p-3 text-center text-sm text-gray-600">
          Searching...
        </div>
      )}

      {/* No results message */}
      {shouldShowNoResults && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white shadow-lg border rounded-md mt-1 p-3 text-center text-sm text-gray-500">
          No results found for "{query}"
        </div>
      )}

      {/* Unified Search Suggestions */}
      {shouldShowUnifiedSuggestions && (
        <UnifiedSearchSuggestions
          friends={unifiedResults.friends}
          products={unifiedResults.products}
          brands={unifiedResults.brands}
          isVisible={true}
          onFriendSelect={onFriendSelect}
          onProductSelect={onProductSelect}
          onBrandSelect={onBrandSelect}
          onSendFriendRequest={onSendFriendRequest}
          mobile={mobile}
        />
      )}

      {/* Nicole Mode Traditional Suggestions */}
      {shouldShowNicoleSuggestions && (
        <SearchSuggestions
          suggestions={suggestions}
          isVisible={true}
          onSuggestionClick={onSuggestionClick}
          mobile={mobile}
        />
      )}
    </>
  );
};

export default SearchResults;
