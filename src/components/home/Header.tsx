
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, LogIn, Menu, Gift, Baby, Sofa, Bike, Cake, PartyPopper, Briefcase, ChevronDown } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
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

  const handleCategorySelect = (category: string) => {
    navigate(`/gifting?category=${category.toLowerCase()}`);
    setIsCategoriesOpen(false);
  };

  const categories = [
    { name: "Accessories", url: "accessories" },
    { name: "Art & Collectibles", url: "art-collectibles" },
    { name: "Baby", url: "baby" },
    { name: "Bags & Purses", url: "bags-purses" },
    { name: "Bath & Beauty", url: "bath-beauty" },
    { name: "Books, Movies & Music", url: "books-movies-music" },
    { name: "Clothing", url: "clothing" },
    { name: "Craft Supplies & Tools", url: "craft-supplies" },
    { name: "Electronics & Accessories", url: "electronics" },
    { name: "Gifts", url: "gifts" },
    { name: "Home & Living", url: "home-living" },
    { name: "Jewelry", url: "jewelry" },
    { name: "Toys & Games", url: "toys-games" },
    { name: "Wedding & Party", url: "wedding-party" }
  ];

  const categoryFilters = [
    { name: "Experiences", icon: PartyPopper },
    { name: "Baby", icon: Baby },
    { name: "Furniture", icon: Sofa },
    { name: "Sports", icon: Bike },
    { name: "Birthday", icon: Cake },
    { name: "Professional", icon: Briefcase },
    { name: "Holidays", icon: Gift }
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto py-4 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
                alt="Elyphant" 
                className="h-16 w-16 mr-2" 
              />
              <h1 className="text-2xl font-bold">Elyphant</h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Categories</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Category Filters</SheetTitle>
                  <SheetDescription>
                    Browse gifts by category
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-6">
                  {categoryFilters.map((category) => (
                    <SheetClose asChild key={category.name}>
                      <Link 
                        to={`/gifting?category=${category.name.toLowerCase()}`}
                        className="flex items-center p-3 rounded-md hover:bg-accent transition-colors"
                      >
                        <category.icon className="mr-3 h-5 w-5 text-purple-600" />
                        <span>{category.name}</span>
                      </Link>
                    </SheetClose>
                  ))}
                </div>
                <div className="mt-6">
                  <Badge variant="outline" className="mb-2">Popular Categories</Badge>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/gifting?category=birthday">Birthday</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/gifting?category=anniversary">Anniversary</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/gifting?category=easter">Easter</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/gifting?category=mothers-day">Mother's Day</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <DropdownMenu open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  Categories <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-white p-0 max-h-[70vh] overflow-y-auto z-50" 
                align="start"
              >
                {categories.map((category, index) => (
                  <DropdownMenuItem 
                    key={index} 
                    className="px-4 py-2 hover:bg-accent cursor-pointer"
                    onClick={() => handleCategorySelect(category.url)}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
              <PopoverContent className="p-0 w-[calc(100vw-2rem)] sm:w-[450px] z-50" align="start">
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
                      <CommandItem onSelect={() => handleSearchItemSelect("Easter Basket")}>
                        <Search className="mr-2 h-4 w-4" />
                        Easter Basket
                      </CommandItem>
                      <CommandItem onSelect={() => handleSearchItemSelect("Mother's Day Flowers")}>
                        <Search className="mr-2 h-4 w-4" />
                        Mother's Day Flowers
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
                      <CommandItem onSelect={() => handleSearchItemSelect("Easter Egg Hunt")}>
                        <Search className="mr-2 h-4 w-4" />
                        Easter Egg Hunt
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
