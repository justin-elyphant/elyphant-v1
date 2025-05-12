
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Gift, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getNextHoliday, getUpcomingOccasions, GiftOccasion } from "./utils/upcomingOccasions";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import OccasionCards from "./header/OccasionCards";

const MarketplaceHero = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 8,
    minutes: 45,
    seconds: 30
  });
  
  // Get upcoming holidays and friend events
  const upcomingHolidays = getUpcomingOccasions().filter(occ => occ.type === "holiday");
  const { friendOccasions } = useConnectedFriendsSpecialDates();
  
  // Get the next two upcoming holidays
  const nextHoliday = upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;
  const secondHoliday = upcomingHolidays.length > 1 ? upcomingHolidays[1] : null;
  
  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        // Reset when timer ends
        return { days: 3, hours: 8, minutes: 45, seconds: 30 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Handle card click to navigate to search
  const handleOccasionCardClick = (searchQuery: string, personId?: string, occasionType?: string) => {
    const params = new URLSearchParams();
    params.set("search", searchQuery);
    if (personId) params.set("personId", personId);
    if (occasionType) params.set("occasionType", occasionType);
    navigate(`/marketplace?${params.toString()}`);
  };
  
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white mb-6">
      <div className="container mx-auto px-4 py-8">
        <div className={`${isMobile ? 'flex flex-col' : 'grid grid-cols-2 gap-8'} items-center mb-8`}>
          <div className={`${isMobile ? 'mb-6 text-center' : 'text-left'}`}>
            <h1 className="text-3xl font-bold mb-3">Holiday Gift Sale</h1>
            <p className="text-lg mb-4 opacity-90">Find the perfect gifts for everyone on your list with special discounts up to 40% off!</p>
            
            {/* Countdown timer */}
            <div className="flex items-center mb-6 justify-center md:justify-start">
              <Clock className="mr-2 h-5 w-5" />
              <span className="text-lg font-medium">Sale ends in:</span>
            </div>
            
            <div className="flex space-x-3 mb-6 justify-center md:justify-start">
              <div className="bg-white/20 rounded-lg p-2 w-16 text-center">
                <div className="text-2xl font-bold">{timeLeft.days}</div>
                <div className="text-xs">Days</div>
              </div>
              <div className="bg-white/20 rounded-lg p-2 w-16 text-center">
                <div className="text-2xl font-bold">{timeLeft.hours}</div>
                <div className="text-xs">Hours</div>
              </div>
              <div className="bg-white/20 rounded-lg p-2 w-16 text-center">
                <div className="text-2xl font-bold">{timeLeft.minutes}</div>
                <div className="text-xs">Mins</div>
              </div>
              <div className="bg-white/20 rounded-lg p-2 w-16 text-center">
                <div className="text-2xl font-bold">{timeLeft.seconds}</div>
                <div className="text-xs">Secs</div>
              </div>
            </div>
            
            <div className="flex space-x-4 justify-center md:justify-start">
              <Button className="bg-white text-purple-700 hover:bg-gray-100">
                <Gift className="mr-2 h-4 w-4" />
                Shop Now
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/20">
                View Deals
              </Button>
            </div>
          </div>
          
          <div className={`${isMobile ? 'text-center' : 'text-right'}`}>
            <img 
              src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=1470&auto=format&fit=crop" 
              alt="Holiday gifts" 
              className="rounded-lg shadow-lg max-h-72 inline-block"
            />
          </div>
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
        <div className="flex flex-wrap justify-center gap-3 mt-5">
          {['Electronics', 'Fashion', 'Home', 'Books', 'Toys'].map(category => (
            <Link 
              key={category} 
              to={`/marketplace?category=${category.toLowerCase()}`}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceHero;
