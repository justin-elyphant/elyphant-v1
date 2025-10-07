
import React from "react";
import { User, Package, Building2, Globe, Users, Lock } from "lucide-react";
import { FriendSearchResult } from "@/services/search/friendSearchService";
import { Product } from "@/types/product";
import FriendResultCard from "./results/FriendResultCard";

interface UnifiedSearchSuggestionsProps {
  friends: FriendSearchResult[];
  products: Product[];
  brands: string[];
  isVisible: boolean;
  onFriendSelect: (friend: FriendSearchResult) => void;
  onProductSelect: (product: Product) => void;
  onBrandSelect: (brand: string) => void;
  onSendFriendRequest: (friendId: string, friendName: string) => void;
  mobile?: boolean;
}

const UnifiedSearchSuggestions: React.FC<UnifiedSearchSuggestionsProps> = ({
  friends,
  products,
  brands,
  isVisible,
  onFriendSelect,
  onProductSelect,
  onBrandSelect,
  onSendFriendRequest,
  mobile = false
}) => {
  if (!isVisible) return null;

  const hasResults = friends.length > 0 || products.length > 0 || brands.length > 0;

  if (!hasResults) return null;

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto">
      {/* Friends Section */}
      {friends.length > 0 && (
        <div className="border-b border-gray-100">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">People</span>
            <span className="text-xs text-muted-foreground">({friends.length})</span>
          </div>
          <div className="py-1">
            {friends.map((friend) => (
              <FriendResultCard
                key={friend.id}
                friend={friend}
                onSendRequest={onSendFriendRequest}
                onViewProfile={(_id) => onFriendSelect(friend)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Products Section */}
      {products.length > 0 && (
        <div className="border-b border-gray-100">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Products</span>
            <span className="text-xs text-muted-foreground">({products.length})</span>
          </div>
          <div className="py-1">
            {products.slice(0, 5).map((product, idx) => (
              <div
                key={`${product.product_id}-${idx}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onProductSelect(product)}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{product.title}</h3>
                  {product.price && (
                    <p className="text-xs text-gray-600">${product.price.toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brands Section */}
      {brands.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Brands</span>
            <span className="text-xs text-muted-foreground">({brands.length})</span>
          </div>
          <div className="py-1">
            {brands.map((brand, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onBrandSelect(brand)}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{brand}</h3>
                  <p className="text-xs text-gray-600">Browse {brand} products</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedSearchSuggestions;
