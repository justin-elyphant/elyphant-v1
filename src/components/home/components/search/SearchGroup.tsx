
import React from "react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchGroupProps {
  heading: string;
  items: any[];
  onSelect: (value: string) => void;
}

const SearchGroup = ({ heading, items, onSelect }: SearchGroupProps) => {
  if (!items || items.length === 0) return null;

  const handleItemClick = (item: any) => {
    // If it's a product with a title, use that, otherwise use the name
    const value = item.title || item.name;
    onSelect(value);
    
    // Store selected item in sessionStorage to pass to marketplace
    if (item.originalProduct) {
      try {
        sessionStorage.setItem('selected_search_product', JSON.stringify(item.originalProduct));
      } catch (e) {
        console.error('Failed to store search selection in session storage:', e);
      }
    }
  };

  return (
    <CommandGroup heading={heading} className="px-2">
      {items.map((item) => (
        <CommandItem
          key={item.id}
          value={item.title || item.name}
          onSelect={() => handleItemClick(item)}
          className="flex items-center gap-2 px-2 py-1"
        >
          {item.image && (
            <div className="h-8 w-8 overflow-hidden rounded-md bg-gray-100 shrink-0">
              <img
                src={item.image}
                alt={item.title || item.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 truncate">
            <p className="truncate text-sm">
              {item.title || item.name}
              {item.isTopSeller && (
                <span className="ml-2 rounded-full bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5">
                  Top Seller
                </span>
              )}
            </p>
            {(item.rating || item.reviewCount) && (
              <div className="flex items-center text-xs text-muted-foreground">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < Math.floor(item.rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      )}
                    />
                  ))}
                </div>
                {item.reviewCount && (
                  <span className="ml-1">({item.reviewCount})</span>
                )}
              </div>
            )}
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  );
};

export default SearchGroup;
