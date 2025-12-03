import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchableColorDropdown } from "./SearchableColorDropdown";
import { CollapsibleSwatchGrid } from "./CollapsibleSwatchGrid";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Color name to CSS color mapping for common colors
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
  'charcoal': '#374151',
  'carbon': '#1F2937',
};

// Extract primary color from compound names like "Black/Carbon/Active Teal"
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

// Types for product variations
type VariantSpecific = {
  dimension: string;
  value: string;
};

type Variant = {
  variant_specifics: VariantSpecific[];
  product_id: string;
};

type VariationDimension = {
  name: string;
  values: string[];
};

type SelectedVariations = {
  [dimension: string]: string;
};

interface VariationSelectorProps {
  variants: Variant[];
  currentVariantSpecs?: VariantSpecific[];
  onVariationChange: (selectedVariations: SelectedVariations, selectedProductId: string) => void;
  className?: string;
}

export const VariationSelector: React.FC<VariationSelectorProps> = ({
  variants,
  currentVariantSpecs = [],
  onVariationChange,
  className
}) => {
  const [selectedVariations, setSelectedVariations] = useState<SelectedVariations>({});
  const [availableDimensions, setAvailableDimensions] = useState<VariationDimension[]>([]);

  // Initialize selected variations from current product and sync with parent
  // Use ref to avoid stale closure issues without causing re-renders
  const onVariationChangeRef = React.useRef(onVariationChange);
  onVariationChangeRef.current = onVariationChange;

  useEffect(() => {
    if (currentVariantSpecs.length > 0) {
      const initial: SelectedVariations = {};
      currentVariantSpecs.forEach(spec => {
        initial[spec.dimension] = spec.value;
      });
      setSelectedVariations(initial);
      
      // Sync with parent: notify parent hook of initial selection
      const matchingVariant = variants?.find(variant => 
        variant.variant_specifics.every(spec => 
          initial[spec.dimension] === spec.value
        )
      );
      onVariationChangeRef.current(initial, matchingVariant?.product_id || '');
    }
  }, [currentVariantSpecs, variants]);

  // Parse and organize variation dimensions
  useEffect(() => {
    if (!variants || variants.length === 0) return;

    const dimensionMap = new Map<string, Set<string>>();

    // Collect all possible values for each dimension
    variants.forEach(variant => {
      variant.variant_specifics.forEach(spec => {
        if (!dimensionMap.has(spec.dimension)) {
          dimensionMap.set(spec.dimension, new Set());
        }
        dimensionMap.get(spec.dimension)?.add(spec.value);
      });
    });

    // Convert to structured format
    const dimensions: VariationDimension[] = Array.from(dimensionMap.entries()).map(([name, valueSet]) => ({
      name,
      values: Array.from(valueSet).sort()
    }));

    setAvailableDimensions(dimensions);
  }, [variants]);

  // Handle variation selection
  const handleVariationSelect = (dimension: string, value: string) => {
    const newSelections = {
      ...selectedVariations,
      [dimension]: value
    };
    setSelectedVariations(newSelections);

    // Find matching product ID
    const matchingVariant = findMatchingVariant(newSelections);
    const productId = matchingVariant?.product_id || '';
    
    onVariationChange(newSelections, productId);
  };

  // Find variant that matches current selections
  const findMatchingVariant = (selections: SelectedVariations): Variant | null => {
    return variants.find(variant => {
      return variant.variant_specifics.every(spec => 
        selections[spec.dimension] === spec.value
      );
    }) || null;
  };

  // Check if variation value is available given current selections
  const isValueAvailable = (dimension: string, value: string): boolean => {
    const testSelections = { ...selectedVariations, [dimension]: value };
    return variants.some(variant => {
      const selectedDimensions = Object.keys(testSelections);
      return selectedDimensions.every(dim => {
        const spec = variant.variant_specifics.find(s => s.dimension === dim);
        return spec && spec.value === testSelections[dim];
      });
    });
  };

  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Product Options</h4>
        
        {availableDimensions.map(dimension => (
          <div key={dimension.name} className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {dimension.name}
            </label>
            
            {dimension.name.toLowerCase() === 'color' ? (
              // Adaptive color selector based on option count
              dimension.values.length <= 6 ? (
                // Simple swatch grid for 1-6 colors
                <TooltipProvider delayDuration={300}>
                  <div className="flex flex-wrap gap-2 items-center">
                    {dimension.values.map(value => {
                      const isSelected = selectedVariations[dimension.name] === value;
                      const isAvailable = isValueAvailable(dimension.name, value);
                      const colorHex = extractPrimaryColor(value);
                      
                      return (
                        <Tooltip key={value}>
                          <TooltipTrigger asChild>
                            <button
                              disabled={!isAvailable}
                              onClick={() => isAvailable && handleVariationSelect(dimension.name, value)}
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
                  </div>
                  {selectedVariations[dimension.name] && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: <span className="font-medium text-foreground">{selectedVariations[dimension.name]}</span>
                    </p>
                  )}
                </TooltipProvider>
              ) : dimension.values.length <= 12 ? (
                // Collapsible swatch grid for 7-12 colors
                <CollapsibleSwatchGrid
                  values={dimension.values}
                  selected={selectedVariations[dimension.name]}
                  onSelect={(value) => handleVariationSelect(dimension.name, value)}
                  isValueAvailable={(value) => isValueAvailable(dimension.name, value)}
                  initialShow={6}
                />
              ) : (
                // Searchable dropdown for 13+ colors
                <SearchableColorDropdown
                  values={dimension.values}
                  selected={selectedVariations[dimension.name]}
                  onSelect={(value) => handleVariationSelect(dimension.name, value)}
                  isValueAvailable={(value) => isValueAvailable(dimension.name, value)}
                />
              )
            ) : (
              // Other variations as dropdown with 44px touch target
              <Select
                value={selectedVariations[dimension.name] || ""}
                onValueChange={(value) => handleVariationSelect(dimension.name, value)}
              >
                <SelectTrigger className="w-full min-h-[44px] bg-background">
                  <SelectValue placeholder={`Select ${dimension.name.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {dimension.values.map(value => {
                    const isAvailable = isValueAvailable(dimension.name, value);
                    return (
                      <SelectItem
                        key={value}
                        value={value}
                        disabled={!isAvailable}
                        className={cn(
                          "cursor-pointer min-h-[44px]",
                          !isAvailable && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {value}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>

      {/* Disclaimers */}
      <div className="pt-3 space-y-2 border-t">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Image and price may vary by selection</span>
        </div>
      </div>
      
      {/* Selected variation summary */}
      {Object.keys(selectedVariations).length > 0 && (
        <div className="pt-2">
          <div className="flex flex-wrap gap-1">
            {Object.entries(selectedVariations).map(([dimension, value]) => (
              <Badge key={dimension} variant="secondary" className="text-xs">
                {dimension}: {value}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VariationSelector;
