import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Initialize selected variations from current product
  useEffect(() => {
    if (currentVariantSpecs.length > 0) {
      const initial: SelectedVariations = {};
      currentVariantSpecs.forEach(spec => {
        initial[spec.dimension] = spec.value;
      });
      setSelectedVariations(initial);
    }
  }, [currentVariantSpecs]);

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
              // Color variations as swatches with 44px touch targets
              <div className="flex flex-wrap gap-2">
                {dimension.values.map(value => {
                  const isSelected = selectedVariations[dimension.name] === value;
                  const isAvailable = isValueAvailable(dimension.name, value);
                  const colorHex = colorMap[value.toLowerCase()];
                  
                  return (
                    <Button
                      key={value}
                      variant="outline"
                      disabled={!isAvailable}
                      onClick={() => handleVariationSelect(dimension.name, value)}
                      className={cn(
                        "min-h-[44px] px-3 text-xs font-medium transition-all",
                        isSelected && "border-2 border-elyphant-black ring-2 ring-elyphant-black/20",
                        !isAvailable && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {colorHex && (
                        <span 
                          className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                          style={{ backgroundColor: colorHex }}
                        />
                      )}
                      {value}
                    </Button>
                  );
                })}
              </div>
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
