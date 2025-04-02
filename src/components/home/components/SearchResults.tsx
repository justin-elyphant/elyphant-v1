
import React from "react";
import { Search } from "lucide-react";
import { 
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

interface SearchResultsProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onItemSelect: (value: string) => void;
}

const SearchResults = ({ 
  searchTerm, 
  onSearchTermChange, 
  onItemSelect 
}: SearchResultsProps) => {
  return (
    <Command>
      <CommandInput 
        placeholder="Search products, friends, or experiences..." 
        value={searchTerm}
        onValueChange={onSearchTermChange} 
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Products">
          <CommandItem onSelect={() => onItemSelect("Luxury Gift Box")}>
            <Search className="mr-2 h-4 w-4" />
            Luxury Gift Box
          </CommandItem>
          <CommandItem onSelect={() => onItemSelect("Birthday Cards")}>
            <Search className="mr-2 h-4 w-4" />
            Birthday Cards
          </CommandItem>
          <CommandItem onSelect={() => onItemSelect("Handmade Jewelry")}>
            <Search className="mr-2 h-4 w-4" />
            Handmade Jewelry
          </CommandItem>
          <CommandItem onSelect={() => onItemSelect("Easter Basket")}>
            <Search className="mr-2 h-4 w-4" />
            Easter Basket
          </CommandItem>
          <CommandItem onSelect={() => onItemSelect("Mother's Day Flowers")}>
            <Search className="mr-2 h-4 w-4" />
            Mother's Day Flowers
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Friends">
          <CommandItem onSelect={() => onItemSelect("Alex's Wishlist")}>
            <Search className="mr-2 h-4 w-4" />
            Alex's Wishlist
          </CommandItem>
          <CommandItem onSelect={() => onItemSelect("Sarah's Birthday")}>
            <Search className="mr-2 h-4 w-4" />
            Sarah's Birthday
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Experiences">
          <CommandItem onSelect={() => onItemSelect("Virtual Wine Tasting")}>
            <Search className="mr-2 h-4 w-4" />
            Virtual Wine Tasting
          </CommandItem>
          <CommandItem onSelect={() => onItemSelect("Spa Day Package")}>
            <Search className="mr-2 h-4 w-4" />
            Spa Day Package
          </CommandItem>
          <CommandItem onSelect={() => onItemSelect("Easter Egg Hunt")}>
            <Search className="mr-2 h-4 w-4" />
            Easter Egg Hunt
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export default SearchResults;
