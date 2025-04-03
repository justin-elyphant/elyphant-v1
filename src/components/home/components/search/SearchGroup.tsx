
import React from "react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchItem {
  id: string;
  name: string;
  title?: string;
  image?: string;
  isTopSeller?: boolean;
}

interface SearchGroupProps {
  heading: string;
  items: SearchItem[];
  onSelect: (value: string) => void;
}

const SearchGroup: React.FC<SearchGroupProps> = ({ heading, items, onSelect }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading={heading}>
      {items.map((item) => (
        <CommandItem
          key={item.id}
          value={item.name}
          onSelect={() => onSelect(item.name)}
          className="flex items-center gap-2"
        >
          {item.image && (
            <div className="h-8 w-8 rounded overflow-hidden shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 truncate">
            {item.name}
            {item.isTopSeller && (
              <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 text-xs">
                Top Seller
              </Badge>
            )}
          </div>
          <Check className="h-4 w-4 opacity-0 group-aria-selected:opacity-100" />
        </CommandItem>
      ))}
    </CommandGroup>
  );
};

export default SearchGroup;
