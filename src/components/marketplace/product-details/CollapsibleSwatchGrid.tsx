import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Color name to CSS color mapping
const colorMap: Record<string, string> = {
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#DC2626',
  'blue': '#2563EB',
  'navy': '#1E3A8A',
  'green': '#16A34A',
  'yellow': '#EAB308',
  'orange': '#EA580C',
  'pink': '#EC4899',
  'purple': '#9333EA',
  'gray': '#6B7280',
  'grey': '#6B7280',
  'brown': '#92400E',
  'beige': '#D4C5B9',
  'gold': '#F59E0B',
  'silver': '#94A3B8',
  'teal': '#14B8A6',
  'cyan': '#06B6D4',
  'coral': '#F97316',
  'maroon': '#7F1D1D',
  'olive': '#65A30D',
  'cream': '#FEF3C7',
  'tan': '#D4A574',
  'charcoal': '#374151',
  'carbon': '#1F2937',
};

// Extract primary color from compound names
const extractPrimaryColor = (colorName: string): string | null => {
  const lowerName = colorName.toLowerCase();
  
  if (colorMap[lowerName]) return colorMap[lowerName];
  
  const parts = lowerName.split(/[\/\-\s]+/);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (colorMap[trimmed]) return colorMap[trimmed];
  }
  
  const colorKeywords = Object.keys(colorMap);
  for (const keyword of colorKeywords) {
    if (lowerName.includes(keyword)) {
      return colorMap[keyword];
    }
  }
  
  return null;
};

interface CollapsibleSwatchGridProps {
  values: string[];
  selected: string | undefined;
  onSelect: (value: string) => void;
  isValueAvailable: (value: string) => boolean;
  initialShow?: number;
}

export const CollapsibleSwatchGrid: React.FC<CollapsibleSwatchGridProps> = ({
  values,
  selected,
  onSelect,
  isValueAvailable,
  initialShow = 6
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const visibleValues = isExpanded ? values : values.slice(0, initialShow);
  const hiddenCount = values.length - initialShow;
  const hasMore = hiddenCount > 0;

  return (
    <div className="space-y-2">
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap gap-2 items-center">
          {visibleValues.map((value) => {
            const isSelected = selected === value;
            const isAvailable = isValueAvailable(value);
            const colorHex = extractPrimaryColor(value);
            
            return (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <button
                    disabled={!isAvailable}
                    onClick={() => isAvailable && onSelect(value)}
                    className={cn(
                      "w-[44px] h-[44px] flex items-center justify-center rounded-lg transition-all",
                      "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      !isAvailable && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <span 
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        isSelected && "ring-2 ring-offset-2 ring-foreground",
                        colorHex === '#FFFFFF' && "border border-border",
                        !colorHex && "bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500"
                      )}
                      style={colorHex ? { backgroundColor: colorHex } : undefined}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="text-xs">{value}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          {hasMore && !isExpanded && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="min-h-[44px] px-3 text-xs font-medium"
            >
              +{hiddenCount} more
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          )}
          
          {isExpanded && hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="min-h-[44px] px-3 text-xs font-medium text-muted-foreground"
            >
              Show less
              <ChevronUp className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </TooltipProvider>
      
      {/* Show selected color name below swatches */}
      {selected && (
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{selected}</span>
        </p>
      )}
    </div>
  );
};

export default CollapsibleSwatchGrid;
