import React, { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

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

// Extract primary color from compound names like "Black/Carbon/Active Teal"
const extractPrimaryColor = (colorName: string): string | null => {
  const lowerName = colorName.toLowerCase();
  
  // Direct match first
  if (colorMap[lowerName]) return colorMap[lowerName];
  
  // Split by common separators
  const parts = lowerName.split(/[\/\-\s]+/);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (colorMap[trimmed]) return colorMap[trimmed];
  }
  
  // Try partial matches for common color keywords
  const colorKeywords = Object.keys(colorMap);
  for (const keyword of colorKeywords) {
    if (lowerName.includes(keyword)) {
      return colorMap[keyword];
    }
  }
  
  return null;
};

interface SearchableColorDropdownProps {
  values: string[];
  selected: string | undefined;
  onSelect: (value: string) => void;
  isValueAvailable: (value: string) => boolean;
}

export const SearchableColorDropdown: React.FC<SearchableColorDropdownProps> = ({
  values,
  selected,
  onSelect,
  isValueAvailable
}) => {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  const selectedColor = extractPrimaryColor(selected || "");

  const TriggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full min-h-[44px] justify-between bg-background"
    >
      <div className="flex items-center gap-2 truncate">
        {selectedColor && (
          <span 
            className="w-5 h-5 rounded-full border border-border flex-shrink-0"
            style={{ backgroundColor: selectedColor }}
          />
        )}
        <span className="truncate">
          {selected || "Select color..."}
        </span>
      </div>
      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const ColorList = (
    <Command className="bg-background">
      <CommandInput placeholder="Search colors..." className="min-h-[44px]" />
      <CommandList className="max-h-[300px]">
        <CommandEmpty>No color found.</CommandEmpty>
        <CommandGroup>
          {values.map((value) => {
            const isAvailable = isValueAvailable(value);
            const colorHex = extractPrimaryColor(value);
            const isSelected = selected === value;
            
            return (
              <CommandItem
                key={value}
                value={value}
                disabled={!isAvailable}
                onSelect={() => {
                  if (isAvailable) {
                    onSelect(value);
                    setOpen(false);
                  }
                }}
                className={cn(
                  "min-h-[44px] cursor-pointer flex items-center gap-3",
                  !isAvailable && "opacity-50 cursor-not-allowed",
                  isSelected && "bg-accent"
                )}
              >
                {colorHex ? (
                  <span 
                    className={cn(
                      "w-5 h-5 rounded-full border flex-shrink-0",
                      colorHex === '#FFFFFF' ? "border-border" : "border-transparent"
                    )}
                    style={{ backgroundColor: colorHex }}
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex-shrink-0" />
                )}
                <span className="flex-1 truncate">{value}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  // Use Drawer on mobile, Popover on desktop
  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {TriggerButton}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh] pb-safe">
          <div className="mt-4 pb-6">
            <h3 className="text-lg font-semibold px-4 mb-3">Select Color</h3>
            {ColorList}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {TriggerButton}
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-background border shadow-lg z-50" align="start">
        {ColorList}
      </PopoverContent>
    </Popover>
  );
};

export default SearchableColorDropdown;
