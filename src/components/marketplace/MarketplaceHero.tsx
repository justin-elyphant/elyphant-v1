
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import GiftCountdown from "@/components/home/sections/GiftCountdown";
import { getNextHoliday, getUpcomingOccasions } from "@/components/marketplace/utils/upcomingOccasions";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import { useTargetEvent } from "@/components/marketplace/hero/useTargetEvent";
import HeroContent from "@/components/marketplace/hero/HeroContent";
import { Badge } from "@/components/ui/badge";
import { Gift, Heart, Users } from "lucide-react";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { format } from "date-fns";

interface MarketplaceHeroProps {
  isCollapsed?: boolean;
}

const MarketplaceHero = ({ isCollapsed = false }: MarketplaceHeroProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const nextHoliday = getNextHoliday();
  const upcomingHolidays = getUpcomingOccasions();
  const { friendOccasions } = useConnectedFriendsSpecialDates();
  
  // Use the target event hook to determine what to show
  const { targetEvent } = useTargetEvent(user, nextHoliday, upcomingHolidays, friendOccasions);

  if (isCollapsed) {
    return (
      <ResponsiveContainer className="py-3">
        {targetEvent && (
          <div className="mb-4">
            <GiftCountdown event={targetEvent} />
            <p className="text-center text-sm text-gray-600 mt-2">
              {format(targetEvent.date, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        )}
        {nextHoliday && !targetEvent && (
          <div className="mb-4">
            <GiftCountdown event={nextHoliday} />
            <p className="text-center text-sm text-gray-600 mt-2">
              {format(nextHoliday.date, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        )}
        {!user && (
          <div className="mt-2 text-center">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
              <Heart className="h-3 w-3 mr-1" />
              Sign up to save favorites and get personalized recommendations
            </Badge>
          </div>
        )}
      </ResponsiveContainer>
    );
  }

  // For logged-in users with target events, show the dynamic hero
  if (user && targetEvent) {
    return (
      <ResponsiveContainer className="py-12">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <HeroContent targetEvent={targetEvent} isMobile={false} />
          </div>
          <div className="md:w-1/2 flex justify-end">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a" 
                alt="Person opening a gift" 
                className="rounded-lg shadow-lg max-w-full h-auto max-h-[220px] object-cover"
              />
              <div className="absolute bottom-4 right-4 bg-white bg-opacity-80 rounded-lg px-3 py-2 text-sm font-medium text-purple-800 shadow-sm">
                Personalized Gift Experiences
              </div>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  // Default hero for non-authenticated users or users without upcoming events
  return (
    <ResponsiveContainer className="py-8 text-center">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
        Discover Perfect Gifts
      </h1>
      <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
        Browse thousands of thoughtful gifts for every occasion, interest, and relationship
      </p>
      
      {nextHoliday && (
        <div className="mb-4">
          <GiftCountdown event={nextHoliday} />
          <p className="text-center text-sm text-gray-600 mt-2">
            {format(nextHoliday.date, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
      )}
      
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
              onClick={() => navigate("/sign-up")}
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
    </ResponsiveContainer>
  );
};

export default MarketplaceHero;
