
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import GiftCountdown from "@/components/home/sections/GiftCountdown";
import { getNextHoliday } from "@/components/marketplace/utils/upcomingOccasions";
import { Badge } from "@/components/ui/badge";
import { Gift, Heart, Users } from "lucide-react";

interface MarketplaceHeroProps {
  isCollapsed?: boolean;
}

const MarketplaceHero = ({ isCollapsed = false }: MarketplaceHeroProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const nextHoliday = getNextHoliday();

  if (isCollapsed) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <div className="container mx-auto px-4 py-3">
          {nextHoliday && <GiftCountdown event={nextHoliday} />}
          {!user && (
            <div className="mt-2 text-center">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                <Heart className="h-3 w-3 mr-1" />
                Sign up to save favorites and get personalized recommendations
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 py-8 border-b">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Discover Perfect Gifts
        </h1>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Browse thousands of thoughtful gifts for every occasion, interest, and relationship
        </p>
        
        {nextHoliday && <GiftCountdown event={nextHoliday} />}
        
        {!user && (
          <div className="mt-6 p-4 bg-white/80 rounded-lg shadow-sm max-w-md mx-auto">
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Heart className="h-4 w-4 text-pink-500" />
                Save favorites
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Gift className="h-4 w-4 text-purple-500" />
                Get recommendations
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Users className="h-4 w-4 text-blue-500" />
                Share with friends
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button 
                size="sm" 
                onClick={() => navigate("/signup")}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Sign Up Free
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/sign-in")}
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceHero;
