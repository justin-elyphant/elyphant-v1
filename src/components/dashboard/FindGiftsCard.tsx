
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Gift, Search, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { categories } from "@/components/home/components/CategoriesDropdown";

const FindGiftsCard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const popularCategories = [
    { name: "Birthday", path: "/marketplace?category=birthday" },
    { name: "Anniversary", path: "/marketplace?category=anniversary" },
    { name: "Wedding", path: "/marketplace?category=wedding" },
  ];

  const handleCategorySelect = (categoryUrl: string) => {
    navigate(`/marketplace?category=${categoryUrl}`);
    setIsCategoriesOpen(false);
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Gift className="h-5 w-5 mr-2 text-purple-500" />
          Find Gifts
        </CardTitle>
        <CardDescription>
          Discover perfect gifts for anyone
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search for gifts..." 
                className="pl-10 w-full bg-purple-50 focus:bg-white transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
            <p className="text-sm text-muted-foreground">
              Browse our marketplace for curated gift ideas for any occasion.
            </p>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-1">
                    Categories <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-56 bg-white p-0 max-h-[40vh] overflow-y-auto z-50" 
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
              
              {popularCategories.map((category) => (
                <Button 
                  key={category.name}
                  size="sm" 
                  variant="outline" 
                  className="text-xs" 
                  onClick={() => navigate(category.path)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            <Button className="w-full" asChild>
              <Link to="/marketplace">Explore Marketplace</Link>
            </Button>
          </div>
          
          <div className="space-y-4 hidden md:block">
            <div className="bg-purple-50 p-4 rounded-md">
              <h3 className="font-medium text-sm flex items-center mb-2">
                <Sparkles className="h-4 w-4 mr-1 text-purple-600" />
                Featured Gifts
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {["Birthday", "Anniversary", "Wedding", "Graduation", "Holiday", "Thank You"].map((category) => (
                  <Button 
                    key={category}
                    size="sm" 
                    variant="ghost" 
                    className="justify-start text-sm h-8" 
                    onClick={() => navigate(`/marketplace?category=${category.toLowerCase()}`)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FindGiftsCard;
