
import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { categories } from "@/components/home/components/CategoriesDropdown";

const MarketplaceHeader = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(location.search);
    params.set("search", searchTerm);
    navigate(`${location.pathname}?${params.toString()}`);
    setIsSearchOpen(false);
  };

  const handleSearchItemSelect = (value: string) => {
    setSearchTerm(value);
    const params = new URLSearchParams(location.search);
    params.set("search", value);
    navigate(`${location.pathname}?${params.toString()}`);
    setIsSearchOpen(false);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <img 
          src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
          alt="Elyphant" 
          className="h-12 w-12 mr-3" 
        />
        <h1 className="text-4xl font-bold">Product Marketplace</h1>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-6">
        {categories.slice(0, 6).map((category, index) => (
          <a 
            key={index}
            href={`/marketplace?category=${category.url}`}
            className="text-sm px-3 py-1 border rounded-full hover:bg-accent transition-colors"
          >
            {category.name}
          </a>
        ))}
        <a 
          href="/marketplace"
          className="text-sm px-3 py-1 border rounded-full hover:bg-accent transition-colors"
        >
          View All
        </a>
      </div>
      
      <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search products, vendors, or experiences..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={() => setIsSearchOpen(true)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[calc(100vw-2rem)] sm:w-[450px]" align="start">
          <Command>
            <CommandInput 
              placeholder="Search products, vendors, or experiences..." 
              value={searchTerm}
              onValueChange={setSearchTerm} 
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Products">
                <CommandItem onSelect={() => handleSearchItemSelect("Luxury Gift Box")}>
                  <Search className="mr-2 h-4 w-4" />
                  Luxury Gift Box
                </CommandItem>
                <CommandItem onSelect={() => handleSearchItemSelect("Birthday Cards")}>
                  <Search className="mr-2 h-4 w-4" />
                  Birthday Cards
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Vendors">
                <CommandItem onSelect={() => handleSearchItemSelect("Premium Gifts Co.")}>
                  <Search className="mr-2 h-4 w-4" />
                  Premium Gifts Co.
                </CommandItem>
                <CommandItem onSelect={() => handleSearchItemSelect("Deluxe Chocolates")}>
                  <Search className="mr-2 h-4 w-4" />
                  Deluxe Chocolates
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MarketplaceHeader;
