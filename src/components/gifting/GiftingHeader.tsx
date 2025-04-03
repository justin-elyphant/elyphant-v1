
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, Search, User, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SearchResults from "@/components/home/components/SearchResults";

const GiftingHeader = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract search from URL when component mounts or location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [location.search]);

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    // Open the search results popover when the user starts typing
    if (value.trim().length > 0 && !isSearchOpen) {
      setIsSearchOpen(true);
    } else if (value.trim().length === 0) {
      setIsSearchOpen(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
    }
  };
  
  const handleSearchItemSelect = (value: string) => {
    if (!value.trim()) return;
    
    setSearchTerm(value);
    setIsSearchOpen(false);
    
    // Brief timeout to ensure the UI updates before navigating
    setTimeout(() => {
      navigate(`/marketplace?search=${encodeURIComponent(value.trim())}`);
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e as unknown as React.FormEvent);
    }
  };
  
  const handlePopoverOpenChange = (open: boolean) => {
    // Only allow opening the popover if we have a search term
    if (open && searchTerm.trim().length === 0) {
      return;
    }
    setIsSearchOpen(open);
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
                alt="Elyphant" 
                className="h-10 w-10 mr-2" 
              />
              <span className="font-bold text-xl">Elyphant</span>
            </Link>
            
            <Link to="/" className="flex items-center text-sm text-gray-500 hover:text-gray-900">
              <Home className="h-4 w-4 mr-1" />
              <span>Home</span>
            </Link>
          </div>
          
          <div className="hidden md:block w-full max-w-md mx-6">
            <Popover open={isSearchOpen} onOpenChange={handlePopoverOpenChange}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="search" 
                    placeholder="Search gifts, friends, or experiences..." 
                    className="pl-10 bg-gray-100 border-gray-200 focus:bg-white"
                    value={searchTerm}
                    onChange={(e) => handleSearchTermChange(e.target.value)}
                    onClick={() => searchTerm.trim().length > 0 && setIsSearchOpen(true)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[calc(100vw-2rem)] sm:w-[450px] z-50" align="start">
                <SearchResults 
                  searchTerm={searchTerm}
                  onSearchTermChange={handleSearchTermChange}
                  onItemSelect={handleSearchItemSelect}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <User className="h-5 w-5" />
            </Button>
            
            <Button className="bg-purple-600 hover:bg-purple-700">
              <img 
                src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
                alt="Gift" 
                className="mr-2 h-4 w-4"
              />
              Create Wishlist
            </Button>
            
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GiftingHeader;
