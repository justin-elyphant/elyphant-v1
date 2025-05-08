
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift, Heart, Star, Cake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { getUpcomingOccasions, getNextHoliday, mergeOccasions, GiftOccasion } from "./utils/upcomingOccasions";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import { Avatar } from "@/components/ui/avatar";

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

  const formatOccasionMessage = (occasion: GiftOccasion) => {
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

  // Handle click on a personalized interest button
  const handleInterestClick = (interest: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("search", `${interest} gift`);
    setSearchParams(params);
  };

  // Get appropriate icon for occasion type
  const getOccasionIcon = (occasion: GiftOccasion) => {
    switch (occasion.type) {
      case 'birthday': 
        return <Cake className="h-5 w-5 mr-2 text-purple-500" />;
      case 'anniversary': 
        return <Heart className="h-5 w-5 mr-2 text-rose-500" />;
      default: 
        return <Gift className="h-5 w-5 mr-2 text-indigo-500" />;
    }
  };

  // Generate dynamic occasion cards based on special dates
  const getOccasionCards = () => {
    // Get next holiday (non-personal occasion)
    const nextHoliday = getNextHoliday();
    
    // Get first birthday and first anniversary from friendOccasions
    const nextBirthday = friendOccasions.find(o => o.type === "birthday");
    const nextAnniversary = friendOccasions.find(o => o.type === "anniversary");
    
    // Get the holiday after the next one for "Thank You" card
    const nextHolidays = getUpcomingOccasions().filter(o => o.type === "holiday");
    const secondHoliday = nextHolidays.length > 1 ? nextHolidays[1] : null;
    
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {/* Anniversary Card - Show either friend's anniversary or generic */}
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-24 border-2 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors"
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            if (nextAnniversary) {
              params.set("search", `${nextAnniversary.personName} anniversary gift`);
            } else {
              params.set("search", "anniversary gift");
            }
            setSearchParams(params);
          }}
        >
          <div className="flex items-center mb-2 relative">
            <Heart className="h-8 w-8 text-rose-500" />
            {nextAnniversary?.personImage && (
              <div className="absolute -right-4 -top-2">
                <Avatar className="h-6 w-6 border border-white">
                  <img src={nextAnniversary.personImage} alt={nextAnniversary.personName} />
                </Avatar>
              </div>
            )}
          </div>
          <span className="font-medium text-sm text-center">
            {nextAnniversary 
              ? `${nextAnniversary.personName}'s Anniversary` 
              : "Anniversary"}
          </span>
        </Button>
        
        {/* Birthday Card - Show either friend's birthday or generic */}
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-24 border-2 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors"
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            if (nextBirthday) {
              params.set("search", `${nextBirthday.personName} birthday gift`);
            } else {
              params.set("search", "birthday gift");
            }
            setSearchParams(params);
          }}
        >
          <div className="flex items-center mb-2 relative">
            <Cake className="h-8 w-8 text-indigo-500" />
            {nextBirthday?.personImage && (
              <div className="absolute -right-4 -top-2">
                <Avatar className="h-6 w-6 border border-white">
                  <img src={nextBirthday.personImage} alt={nextBirthday.personName} />
                </Avatar>
              </div>
            )}
          </div>
          <span className="font-medium text-sm text-center">
            {nextBirthday 
              ? `${nextBirthday.personName}'s Birthday` 
              : "Birthday"}
          </span>
        </Button>
        
        {/* Holiday Card - Always show next upcoming holiday */}
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-24 border-2 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors"
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            if (nextHoliday) {
              params.set("search", `${nextHoliday.searchTerm}`);
            } else {
              params.set("search", "holiday gift");
            }
            setSearchParams(params);
          }}
        >
          <Star className="h-8 w-8 text-amber-500 mb-2" />
          <span className="font-medium text-sm">
            {nextHoliday ? `Shop ${nextHoliday.name}` : "Holiday"}
          </span>
        </Button>
        
        {/* Thank You / Next Holiday Card */}
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-24 border-2 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors"
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            if (secondHoliday) {
              params.set("search", secondHoliday.searchTerm);
            } else {
              params.set("search", "thank you gift");
            }
            setSearchParams(params);
          }}
        >
          <Gift className="h-8 w-8 text-emerald-500 mb-2" />
          <span className="font-medium text-sm">
            {secondHoliday ? `Shop ${secondHoliday.name}` : "Thank You"}
          </span>
        </Button>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-4">
          <Badge className="bg-purple-600 text-white px-3 py-1">New Gift Ideas Daily</Badge>
          <h1 className="text-3xl font-bold text-gray-900">Find the Perfect Gift</h1>
          
          {/* Dynamic event reminder with animation */}
          {currentOccasion && (
            <div className={`flex items-center text-gray-700 font-medium transition-opacity duration-500 ${animationState === "in" ? "opacity-100" : "opacity-0"}`}>
              {getOccasionIcon(currentOccasion)}
              <span>{formatOccasionMessage(currentOccasion)}</span>
            </div>
          )}
          
          {!currentOccasion && (
            <p className="text-gray-700">
              Discover thoughtful gifts for every occasion, interest, and relationship in your life.
            </p>
          )}

          {/* User interests section */}
          {formattedInterests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formattedInterests.slice(0, 3).map((interest, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className="bg-white hover:bg-purple-50 cursor-pointer"
                  onClick={() => handleInterestClick(interest)}
                >
                  {interest}
                </Badge>
              ))}
              {formattedInterests.length > 3 && (
                <Badge variant="outline" className="bg-white">+{formattedInterests.length - 3} more</Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Dynamic occasion cards */}
        {getOccasionCards()}
      </div>
    </div>
  );
};

export default MarketplaceHeader;
