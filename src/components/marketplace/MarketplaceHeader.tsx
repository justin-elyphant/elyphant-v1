
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { getUpcomingOccasions } from "./utils/upcomingOccasions";

interface MarketplaceHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: (term: string) => void;
}

const MarketplaceHeader = ({ searchTerm, setSearchTerm, onSearch }: MarketplaceHeaderProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentOccasion, setCurrentOccasion] = useState<{ name: string; date: Date } | null>(null);
  const [animationState, setAnimationState] = useState<"in" | "out">("in");

  useEffect(() => {
    // Get the closest upcoming occasion
    const occasions = getUpcomingOccasions();
    if (occasions.length > 0) {
      setCurrentOccasion(occasions[0]);
    }

    // Set up rotation of occasions if more than one is available
    if (occasions.length > 1) {
      const rotationInterval = setInterval(() => {
        // Start fade out animation
        setAnimationState("out");
        
        setTimeout(() => {
          // After animation completes, update the occasion
          setCurrentOccasion((current) => {
            const currentIndex = occasions.findIndex(o => 
              o.name === current?.name && o.date.getTime() === current?.date.getTime()
            );
            const nextIndex = (currentIndex + 1) % occasions.length;
            return occasions[nextIndex];
          });
          
          // Start fade in animation
          setAnimationState("in");
        }, 500); // Wait for fade out animation to complete
      }, 8000); // Rotate every 8 seconds
      
      return () => clearInterval(rotationInterval);
    }
  }, []);

  const formatOccasionMessage = (occasion: { name: string; date: Date }) => {
    const daysRemaining = differenceInDays(occasion.date, new Date());
    const formattedDate = format(occasion.date, "EEEE, M/d");
    
    if (daysRemaining === 0) {
      return `${occasion.name} is Today!`;
    } else if (daysRemaining === 1) {
      return `${occasion.name} is Tomorrow, ${formattedDate}`;
    } else {
      return `${occasion.name} is ${formattedDate} – ${daysRemaining} days away!`;
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-4">
          <Badge className="bg-purple-600 text-white px-3 py-1">New Gift Ideas Daily</Badge>
          <h1 className="text-3xl font-bold text-gray-900">Find the Perfect Gift</h1>
          
          {/* Dynamic holiday reminder with animation */}
          {currentOccasion && (
            <p className={`text-purple-800 font-medium transition-opacity duration-500 ${animationState === "in" ? "opacity-100" : "opacity-0"}`}>
              {formatOccasionMessage(currentOccasion)}
            </p>
          )}
          
          {!currentOccasion && (
            <p className="text-gray-700">
              Discover thoughtful gifts for every occasion, interest, and relationship in your life.
            </p>
          )}
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
