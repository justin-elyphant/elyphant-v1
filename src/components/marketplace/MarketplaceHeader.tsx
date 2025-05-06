
import React from "react";
import { Button } from "@/components/ui/button";
import { Gift, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";

interface MarketplaceHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: (term: string) => void;
}

const MarketplaceHeader = ({ searchTerm, setSearchTerm, onSearch }: MarketplaceHeaderProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-4">
          <Badge className="bg-purple-600 text-white px-3 py-1">New Gift Ideas Daily</Badge>
          <h1 className="text-3xl font-bold text-gray-900">Find the Perfect Gift</h1>
          <p className="text-gray-700">
            Discover thoughtful gifts for every occasion, interest, and relationship in your life.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 border-2 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set("search", "anniversary gift");
              setSearchParams(params);
            }}
          >
            <Heart className="h-8 w-8 text-rose-500 mb-2" />
            <span className="font-medium">Anniversary</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 border-2 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set("search", "birthday gift");
              setSearchParams(params);
            }}
          >
            <Gift className="h-8 w-8 text-indigo-500 mb-2" />
            <span className="font-medium">Birthday</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 border-2 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set("search", "holiday gift");
              setSearchParams(params);
            }}
          >
            <Star className="h-8 w-8 text-amber-500 mb-2" />
            <span className="font-medium">Holiday</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 border-2 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set("search", "thank you gift");
              setSearchParams(params);
            }}
          >
            <Gift className="h-8 w-8 text-emerald-500 mb-2" />
            <span className="font-medium">Thank You</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceHeader;
