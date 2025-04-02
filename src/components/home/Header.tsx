
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, LogIn, Menu } from "lucide-react";
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
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

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
                className="h-14 w-14 mr-2" 
              />
              <h1 className="text-2xl font-bold">Elyphant</h1>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-2 mr-4">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[400px] md:w-[500px] lg:w-[600px] grid-cols-2">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-purple-500 to-purple-700 p-6 no-underline outline-none focus:shadow-md"
                            href="/gifting"
                          >
                            <div className="mt-4 mb-2 text-lg font-medium text-white">
                              Popular Categories
                            </div>
                            <p className="text-sm leading-tight text-white/90">
                              Explore our most loved gift categories
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <Link
                          to="/gifting?category=birthday"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Birthday</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Perfect gifts for birthdays
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/gifting?category=anniversary"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Anniversary</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Celebrate special moments
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/gifting?category=wedding"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Wedding</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Wedding gifts and registry items
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/gifting?category=holidays"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Holidays</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Holiday season favorites
                          </p>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Occasions</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px]">
                      <li>
                        <Link
                          to="/gifting?occasion=birthday"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Birthday Gifts</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Find the perfect birthday gift
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/gifting?occasion=graduation"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Graduation</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Celebrate their achievement
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/gifting?occasion=housewarming"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Housewarming</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Welcome them to their new home
                          </p>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/marketplace" className={navigationMenuTriggerStyle()}>
                    Marketplace
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
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
