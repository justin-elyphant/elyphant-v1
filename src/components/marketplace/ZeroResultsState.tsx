/**
 * ZeroResultsState - Beautiful empty state for no search results
 * Shows: "Did you mean...", suggested queries, and fallback products
 */

import React from "react";
import { Search, TrendingUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/utils";

interface ZeroResultsStateProps {
  query: string;
  suggestedQueries?: string[];
  suggestedCorrection?: string;
  fallbackProducts?: any[];
  onSearchSuggestion?: (suggestion: string) => void;
}

const ZeroResultsState: React.FC<ZeroResultsStateProps> = ({
  query,
  suggestedQueries = [],
  suggestedCorrection,
  fallbackProducts = [],
  onSearchSuggestion
}) => {
  const navigate = useNavigate();

  const handleSuggestionClick = (suggestion: string) => {
    if (onSearchSuggestion) {
      onSearchSuggestion(suggestion);
    } else {
      navigate(`/marketplace?search=${encodeURIComponent(suggestion)}`);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Main Empty State */}
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-2">
        No results found for "{query}"
      </h2>

      <p className="text-muted-foreground mb-6 max-w-md">
        We couldn't find any products matching your search. Try a different search term or browse our suggestions below.
      </p>

      {/* Did You Mean? */}
      {suggestedCorrection && suggestedCorrection !== query && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Did you mean:</p>
          <Button
            variant="outline"
            className="min-h-[44px] px-6 rounded-full font-medium"
            onClick={() => handleSuggestionClick(suggestedCorrection)}
          >
            {suggestedCorrection}
          </Button>
        </div>
      )}

      {/* Suggested Queries */}
      {suggestedQueries.length > 0 && (
        <div className="mb-8 w-full max-w-lg">
          <div className="flex items-center justify-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Popular Searches</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedQueries.slice(0, 5).map((suggestion, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                className="min-h-[44px] rounded-full"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Fallback Products */}
      {fallbackProducts.length > 0 && (
        <div className="w-full max-w-4xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Popular Items You Might Like</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {fallbackProducts.slice(0, 8).map((product, index) => (
              <Card 
                key={product.product_id || index}
                className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                onClick={() => handleProductClick(product.product_id)}
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img
                    src={product.main_image || product.image || product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-3">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                    {product.title}
                  </h3>
                  {product.price > 0 && (
                    <p className="text-sm font-semibold text-foreground">
                      {formatPrice(product.price)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Browse All CTA */}
      <div className="mt-8">
        <Button
          variant="default"
          size="lg"
          className="min-h-[44px] px-8 rounded-full bg-gradient-to-r from-purple-600 to-sky-500 text-white"
          onClick={() => navigate('/marketplace?category=best-selling')}
        >
          Browse Best Sellers
        </Button>
      </div>
    </div>
  );
};

export default ZeroResultsState;
