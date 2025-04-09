
import React, { useState } from "react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Star, ImageOff } from "lucide-react";
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
      {items.map((item) => {
        // Use unique key based on id or title/name
        const itemKey = `${item.id || ''}-${item.title || item.name}`;
        
        return (
          <CommandItem
            key={itemKey}
            value={item.title || item.name}
            onSelect={() => handleItemClick(item)}
            className="flex items-center gap-2 px-2 py-1"
          >
            <ProductImageThumbnail item={item} />
            <div className="flex-1 truncate">
              <p className="truncate text-sm">
                {item.title || item.name}
                {item.isTopSeller && (
                  <span className="ml-2 rounded-full bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5">
                    Top Seller
                  </span>
                )}
              </p>
              <ProductRating rating={item.rating} reviewCount={item.reviewCount} />
            </div>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
};

const ProductImageThumbnail = ({ item }: { item: any }) => {
  const [imageError, setImageError] = useState(false);
  
  // If there's no image or imageError is true, show placeholder
  if (!item.image || imageError) {
    // Use first two letters of product name for placeholder
    const initials = (item.title || item.name || '??').substring(0, 2).toUpperCase();
    return (
      <div className="h-10 w-10 flex items-center justify-center rounded-md bg-gray-100 shrink-0 border border-gray-200 text-gray-500 text-xs">
        {initials}
      </div>
    );
  }
  
  return (
    <div className="h-10 w-10 overflow-hidden rounded-md bg-gray-100 shrink-0 border border-gray-200">
      <img
        src={item.image}
        alt={item.title || item.name}
        className="h-full w-full object-contain"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
};

const ProductRating = ({ rating, reviewCount }: { rating?: number; reviewCount?: number }) => {
  if (!rating && !reviewCount) return null;
  
  return (
    <div className="flex items-center text-xs text-muted-foreground">
      {rating ? (
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-3 w-3",
                i < Math.floor(rating || 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              )}
            />
          ))}
        </div>
      ) : null}
      {reviewCount ? (
        <span className="ml-1">({reviewCount})</span>
      ) : null}
    </div>
  );
};

export default SearchGroup;
