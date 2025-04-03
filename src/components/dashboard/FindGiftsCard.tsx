
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Gift, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const FindGiftsCard = () => {
  const [searchTerm, setSearchTerm] = useState("");
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
    { name: "Graduation", path: "/marketplace?category=graduation" },
    { name: "Holiday", path: "/marketplace?category=holiday" },
    { name: "Thank You", path: "/marketplace?category=thankyou" },
  ];

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
              {popularCategories.slice(0, 3).map((category) => (
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
                Popular Categories
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {popularCategories.map((category) => (
                  <Button 
                    key={category.name}
                    size="sm" 
                    variant="ghost" 
                    className="justify-start text-sm h-8" 
                    onClick={() => navigate(category.path)}
                  >
                    {category.name}
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
