
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { getUpcomingOccasions, getNextHoliday, mergeOccasions, GiftOccasion } from "./utils/upcomingOccasions";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import OccasionMessage from "./header/OccasionMessage";
import UserInterests from "./header/UserInterests";
import OccasionCards from "./header/OccasionCards";

interface MarketplaceHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: (term: string) => void;
}

const MarketplaceHeader = ({ searchTerm, setSearchTerm, onSearch }: MarketplaceHeaderProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentOccasion, setCurrentOccasion] = useState<GiftOccasion | null>(null);
  const [animationState, setAnimationState] = useState<"in" | "out">("in");
  const { profile } = useProfile();
  const { friendOccasions, loading: loadingFriendOccasions } = useConnectedFriendsSpecialDates();
  
  // Extract user interests from profile
  const userInterests = profile?.gift_preferences || [];
  const formattedInterests = Array.isArray(userInterests) 
    ? userInterests.map(pref => typeof pref === 'string' ? pref : pref.category)
    : [];

  useEffect(() => {
    // Get all occasions (holidays + friends' special dates)
    const holidays = getUpcomingOccasions();
    const allOccasions = mergeOccasions(holidays, friendOccasions);
    
    if (allOccasions.length > 0) {
      setCurrentOccasion(allOccasions[0]);
    }

    // Set up rotation of occasions if more than one is available
    if (allOccasions.length > 1) {
      const rotationInterval = setInterval(() => {
        // Start fade out animation
        setAnimationState("out");
        
        setTimeout(() => {
          // After animation completes, update the occasion
          setCurrentOccasion((current) => {
            if (!current) return allOccasions[0];
            
            const currentIndex = allOccasions.findIndex(o => 
              o.name === current.name && o.date.getTime() === current.date.getTime()
            );
            const nextIndex = (currentIndex + 1) % allOccasions.length;
            return allOccasions[nextIndex];
          });
          
          // Start fade in animation
          setAnimationState("in");
        }, 500); // Wait for fade out animation to complete
      }, 8000); // Rotate every 8 seconds
      
      return () => clearInterval(rotationInterval);
    }
  }, [friendOccasions]);

  // Handle click on a personalized interest button
  const handleInterestClick = (interest: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("search", `${interest} gift`);
    setSearchParams(params);
  };

  // Handle click on occasion card with enhanced personalization
  const handleCardClick = (searchQuery: string, personId?: string, occasionType?: string) => {
    const params = new URLSearchParams(searchParams);
    
    // Set the basic search query
    params.set("search", searchQuery);
    
    // Add person ID as a parameter if available
    if (personId) {
      params.set("personId", personId);
    } else {
      params.delete("personId");
    }
    
    // Add occasion type as a parameter if available
    if (occasionType) {
      params.set("occasionType", occasionType);
    } else {
      params.delete("occasionType");
    }
    
    setSearchParams(params);
  };

  // Get next holiday (non-personal occasion)
  const nextHoliday = getNextHoliday();
  
  // Get the holiday after the next one for "Thank You" card
  const nextHolidays = getUpcomingOccasions().filter(o => o.type === "holiday");
  const secondHoliday = nextHolidays.length > 1 ? nextHolidays[1] : null;

  return (
    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-4">
          <Badge className="bg-purple-600 text-white px-3 py-1">New Gift Ideas Daily</Badge>
          <h1 className="text-3xl font-bold text-gray-900">Find the Perfect Gift</h1>
          
          {/* Dynamic event reminder with animation */}
          <OccasionMessage 
            occasion={currentOccasion} 
            animationState={animationState} 
          />
          
          {!currentOccasion && (
            <p className="text-gray-700">
              Discover thoughtful gifts for every occasion, interest, and relationship in your life.
            </p>
          )}

          {/* User interests section */}
          <UserInterests 
            interests={formattedInterests} 
            onInterestClick={handleInterestClick} 
          />
        </div>
        
        {/* Dynamic occasion cards */}
        <OccasionCards 
          friendOccasions={friendOccasions}
          nextHoliday={nextHoliday}
          secondHoliday={secondHoliday}
          onCardClick={handleCardClick}
        />
      </div>
    </div>
  );
};

export default MarketplaceHeader;
