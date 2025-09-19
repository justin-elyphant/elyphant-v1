/**
 * Smart Search Indicator - Shows size optimization status and suggestions
 */
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Plus } from "lucide-react";

interface SmartSearchIndicatorProps {
  hasMoreSizes: boolean;
  sizeOptimized: boolean;
  totalSizeVariations: number;
  suggestedSizeSearches: string[];
  onLoadMoreSizes: () => void;
  onSizeSearch: (query: string) => void;
  loading?: boolean;
}

export const SmartSearchIndicator: React.FC<SmartSearchIndicatorProps> = ({
  hasMoreSizes,
  sizeOptimized,
  totalSizeVariations,
  suggestedSizeSearches,
  onLoadMoreSizes,
  onSizeSearch,
  loading = false
}) => {
  if (!sizeOptimized && totalSizeVariations === 0) {
    return null;
  }

  return (
    <div className="bg-muted/50 rounded-lg p-4 mb-4 border">
      <div className="flex items-center gap-2 mb-2">
        <Info className="h-4 w-4 text-primary" />
        <span className="font-medium">Smart Size Detection</span>
        <Badge variant="secondary">
          {totalSizeVariations} sizes found
        </Badge>
        {sizeOptimized && (
          <Badge variant="default">Optimized</Badge>
        )}
      </div>
      
      {hasMoreSizes && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            More sizes may be available. Try loading additional size options or specific size searches.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onLoadMoreSizes}
              disabled={loading}
              className="h-8"
            >
              <Plus className="h-3 w-3 mr-1" />
              Load More Sizes
            </Button>
            
            {suggestedSizeSearches.slice(0, 2).map((suggestion, index) => (
              <Button
                key={index}
                size="sm"
                variant="ghost"
                onClick={() => onSizeSearch(suggestion)}
                className="h-8 text-xs"
              >
                Try: {suggestion.split(' ').slice(-2).join(' ')}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};