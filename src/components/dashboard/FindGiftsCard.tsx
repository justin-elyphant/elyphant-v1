
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Gift, Search, ChevronDown, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UNIVERSAL_CATEGORIES } from "@/constants/categories";

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

  const handleCategorySelect = (category: any) => {
    if (category.searchTerm) {
      navigate(`/marketplace?search=${encodeURIComponent(category.searchTerm)}&category=${encodeURIComponent(category.value)}`);
    } else {
      navigate(`/marketplace?category=${encodeURIComponent(category.value)}`);
    }
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
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Browse our marketplace for curated gift ideas for any occasion.
          </p>

          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:space-x-3">
            <div>
              <DropdownMenu open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                    Categories <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-56 bg-white p-0 max-h-[40vh] overflow-y-auto z-50" 
                  align="start"
                >
                  {UNIVERSAL_CATEGORIES.map((category) => (
                    <DropdownMenuItem 
                      key={category.id} 
                      className="px-4 py-2 hover:bg-accent cursor-pointer"
                      onClick={() => handleCategorySelect(category)}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search for gifts..." 
                  className="pl-10 w-full bg-purple-50 focus:bg-white transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
            </div>
            
            <div className="flex space-x-2">
              {["Birthday", "Anniversary", "Wedding"].map((category) => (
                <Button 
                  key={category}
                  size="sm" 
                  variant="outline" 
                  className="text-xs whitespace-nowrap" 
                  onClick={() => navigate(`/marketplace?category=${category.toLowerCase()}`)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              style={{ background: 'linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%)' }}
              className="px-8 text-white hover:opacity-90 shadow-md" 
              asChild
            >
              <Link to="/marketplace" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Explore Marketplace
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FindGiftsCard;
