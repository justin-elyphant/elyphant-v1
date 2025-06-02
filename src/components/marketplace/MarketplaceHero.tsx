
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
import CompactCountdown from "@/components/marketplace/hero/CompactCountdown";
import ModernCTA from "@/components/marketplace/hero/ModernCTA";

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
          <div className="mb-4 flex justify-center">
            <CompactCountdown event={targetEvent} />
          </div>
        )}
        {nextHoliday && !targetEvent && (
          <div className="mb-4 flex justify-center">
            <CompactCountdown event={nextHoliday} />
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
      <div className="relative min-h-[300px] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/aebd4a02-6f36-4c3f-acf5-c95c882efc03.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-black/15"></div>
        </div>

        <ResponsiveContainer className="relative z-10 py-12">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-6 md:mb-0 text-white">
              <div className="text-left">
                <HeroContent targetEvent={targetEvent} isMobile={false} />
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </div>
    );
  }

  // Default hero for non-authenticated users with modern design
  return (
    <div className="relative min-h-[500px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/aebd4a02-6f36-4c3f-acf5-c95c882efc03.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-black/15"></div>
      </div>

      <ResponsiveContainer className="relative z-10 py-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Left side - Hero content */}
          <div className="lg:w-1/2 text-white text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-shadow-lg">
              Discover Perfect Gifts
            </h1>
            <p className="text-lg mb-6 max-w-xl mx-auto lg:mx-0 text-shadow-md">
              Browse thousands of thoughtful gifts for every occasion, interest, and relationship
            </p>
            
            {/* Compact countdown positioned naturally in flow */}
            {nextHoliday && (
              <div className="mb-6 flex justify-center lg:justify-start">
                <CompactCountdown event={nextHoliday} />
              </div>
            )}
          </div>
          
          {/* Right side - Modern CTA */}
          <div className="lg:w-1/2 flex justify-center lg:justify-end">
            <ModernCTA />
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default MarketplaceHero;
