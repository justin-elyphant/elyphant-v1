import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface SuggestionDropdownProps {
  isOpen: boolean;
  filteredSuggestions: string[];
  selectedIndex: number;
  onSuggestionSelect: (suggestion: string) => void;
}

export const SuggestionDropdown: React.FC<SuggestionDropdownProps> = ({
  isOpen,
  filteredSuggestions,
  selectedIndex,
  onSuggestionSelect
}) => {
  if (!isOpen || filteredSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
      <div className="p-1">
        {filteredSuggestions.map((suggestion, index) => (
          <div
            key={index}
            onClick={() => onSuggestionSelect(suggestion)}
            className={cn(
              "px-2 py-1.5 text-sm cursor-pointer rounded-sm flex items-center",
              index === selectedIndex 
                ? "bg-accent text-accent-foreground" 
                : "hover:bg-accent/50"
            )}
          >
            <Check className={cn("mr-2 h-4 w-4", index === selectedIndex ? "opacity-100" : "opacity-0")} />
            {suggestion}
          </div>
        ))}
      </div>
    </div>
  );
};