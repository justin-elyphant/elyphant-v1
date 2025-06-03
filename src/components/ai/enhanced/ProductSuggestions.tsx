
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, ArrowRight } from "lucide-react";

interface ProductSuggestionsProps {
  searchSuggestions: string[];
  onSearchQuery: (query: string) => void;
  recipientName?: string;
}

const ProductSuggestions: React.FC<ProductSuggestionsProps> = ({
  searchSuggestions,
  onSearchQuery,
  recipientName
}) => {
  if (searchSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-medium text-gray-700">
          Smart Suggestions {recipientName && `for ${recipientName}`}
        </span>
      </div>

      <div className="grid gap-2">
        {searchSuggestions.map((suggestion, index) => (
          <Card 
            key={index}
            className="hover:shadow-md transition-shadow cursor-pointer border-purple-100"
            onClick={() => onSearchQuery(suggestion)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {suggestion}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-3 p-3 bg-purple-50 rounded-md">
        <p className="text-xs text-purple-700">
          💡 These suggestions are based on {recipientName ? `${recipientName}'s interests and wishlist patterns` : 'the recipient\'s profile and preferences'}.
        </p>
      </div>
    </div>
  );
};

export default ProductSuggestions;
