
import React from "react";
import { Search } from "lucide-react";
import { CommandGroup, CommandItem } from "@/components/ui/command";

interface SearchGroupProps {
  heading: string;
  items: { id?: string | number; name?: string; title?: string; value?: string }[];
  onSelect: (value: string) => void;
}

const SearchGroup = ({ heading, items, onSelect }: SearchGroupProps) => {
  if (items.length === 0) return null;
  
  return (
    <CommandGroup heading={heading}>
      {items.map((item, index) => {
        const displayText = item.title || item.name || item.value || "";
        const itemValue = item.value || displayText;
        const key = item.id ? `${item.id}` : `${heading}-${index}`;
        
        return (
          <CommandItem 
            key={key}
            onSelect={() => onSelect(displayText)}
            value={displayText}
          >
            <Search className="mr-2 h-4 w-4" />
            {displayText}
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
};

export default SearchGroup;
