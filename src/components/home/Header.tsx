
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const Header = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/gifting?search=${encodeURIComponent(searchTerm)}`);
      setIsSearchOpen(false);
    }
  };

  const handleSearchItemSelect = (value: string) => {
    setSearchTerm(value);
    navigate(`/gifting?search=${encodeURIComponent(value)}`);
    setIsSearchOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto py-4 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
                alt="Elyphant" 
                className="h-12 w-12 mr-2" 
              />
              <h1 className="text-2xl font-bold">Elyphant</h1>
            </Link>
          </div>
          
          <div className="w-full md:w-2/5 lg:w-1/3">
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Search products, friends, or experiences..." 
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
                    placeholder="Search products, friends, or experiences..." 
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
                      <CommandItem onSelect={() => handleSearchItemSelect("Handmade Jewelry")}>
                        <Search className="mr-2 h-4 w-4" />
                        Handmade Jewelry
                      </CommandItem>
                    </CommandGroup>
                    <CommandGroup heading="Friends">
                      <CommandItem onSelect={() => handleSearchItemSelect("Alex's Wishlist")}>
                        <Search className="mr-2 h-4 w-4" />
                        Alex's Wishlist
                      </CommandItem>
                      <CommandItem onSelect={() => handleSearchItemSelect("Sarah's Birthday")}>
                        <Search className="mr-2 h-4 w-4" />
                        Sarah's Birthday
                      </CommandItem>
                    </CommandGroup>
                    <CommandGroup heading="Experiences">
                      <CommandItem onSelect={() => handleSearchItemSelect("Virtual Wine Tasting")}>
                        <Search className="mr-2 h-4 w-4" />
                        Virtual Wine Tasting
                      </CommandItem>
                      <CommandItem onSelect={() => handleSearchItemSelect("Spa Day Package")}>
                        <Search className="mr-2 h-4 w-4" />
                        Spa Day Package
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <nav className="flex items-center space-x-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/sign-in">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Link to="/sign-up">
                <User className="mr-2 h-4 w-4" />
                Sign Up
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
