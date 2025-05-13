
import React, { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { getNextHoliday, getUpcomingOccasions } from "./utils/upcomingOccasions";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import OccasionCards from "./header/OccasionCards";
import { useAuth } from "@/contexts/auth";
import HeroContent from "./hero/HeroContent";
import HeroImage from "./hero/HeroImage";
import CategoryLinks from "./hero/CategoryLinks";
import useTargetEvent from "./hero/useTargetEvent";

const MarketplaceHero = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get upcoming holidays and friend events
  const upcomingHolidays = getUpcomingOccasions().filter(occ => occ.type === "holiday");
  const { friendOccasions } = useConnectedFriendsSpecialDates();
  
  // Get the next two upcoming holidays
  const nextHoliday = upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;
  const secondHoliday = upcomingHolidays.length > 1 ? upcomingHolidays[1] : null;

  // For debugging
  useEffect(() => {
    console.log("Current date:", new Date());
    console.log("Upcoming holidays:", upcomingHolidays);
    console.log("Next holiday:", nextHoliday);
    console.log("Friend occasions:", friendOccasions);
  }, [upcomingHolidays, nextHoliday, friendOccasions]);
  
  // Get the target event for countdown
  const { targetEvent } = useTargetEvent(user, nextHoliday, upcomingHolidays, friendOccasions);
  
  // Handle card click to navigate to search
  const handleOccasionCardClick = (searchQuery: string, personId?: string, occasionType?: string) => {
    const params = new URLSearchParams();
    params.set("search", searchQuery);
    if (personId) params.set("personId", personId);
    if (occasionType) params.set("occasionType", occasionType);
    navigate(`/marketplace?${params.toString()}`);
  };
  
  // Popular shopping categories
  const popularCategories = ['Electronics', 'Fashion', 'Home', 'Books', 'Toys'];
  
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white mb-6">
      <div className="container mx-auto px-4 py-8">
        <div className={`${isMobile ? 'flex flex-col' : 'grid grid-cols-2 gap-8'} items-center mb-8`}>
          <HeroContent 
            targetEvent={targetEvent} 
            isMobile={isMobile} 
          />
          
          <HeroImage 
            isMobile={isMobile} 
            imageSrc="https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=1470&auto=format&fit=crop" 
            altText="Holiday gifts" 
          />
        </div>
        
        {/* Occasion cards section for upcoming events */}
        <div className="mb-6">
          <h2 className="text-xl font-medium mb-3">Upcoming Gift Occasions</h2>
          <OccasionCards 
            friendOccasions={friendOccasions}
            nextHoliday={nextHoliday}
            secondHoliday={secondHoliday}
            onCardClick={handleOccasionCardClick}
          />
        </div>
        
        {/* Quick category links */}
        <CategoryLinks categories={popularCategories} />
      </div>
    </div>
  );
};

export default MarketplaceHero;
