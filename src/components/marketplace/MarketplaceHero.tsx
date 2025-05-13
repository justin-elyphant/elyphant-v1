
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Gift, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getNextHoliday, getUpcomingOccasions, GiftOccasion } from "./utils/upcomingOccasions";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import OccasionCards from "./header/OccasionCards";
import { useAuth } from "@/contexts/auth";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, addDays } from "date-fns";

const MarketplaceHero = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [targetEvent, setTargetEvent] = useState<{
    name: string;
    date: Date;
    type: string;
  } | null>(null);
  
  // Get upcoming holidays and friend events
  const upcomingHolidays = getUpcomingOccasions().filter(occ => occ.type === "holiday");
  const { friendOccasions } = useConnectedFriendsSpecialDates();
  
  // Get the next two upcoming holidays
  const nextHoliday = upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;
  const secondHoliday = upcomingHolidays.length > 1 ? upcomingHolidays[1] : null;
  
  // Find the closest event (holiday or friend event)
  useEffect(() => {
    // Default to the next holiday if available
    let closestEvent = nextHoliday;
    let closestDate = closestEvent?.date;
    
    // For logged in users, check if a friend event is closer
    if (user && friendOccasions.length > 0) {
      const sortedEvents = [...friendOccasions, ...(nextHoliday ? [nextHoliday] : [])]
        .filter(event => event.date > new Date()) // Only future events
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      if (sortedEvents.length > 0) {
        closestEvent = sortedEvents[0];
        closestDate = closestEvent.date;
      }
    }
    
    if (closestEvent && closestDate) {
      setTargetEvent({
        name: closestEvent.name,
        date: closestDate,
        type: closestEvent.type
      });
    }
  }, [nextHoliday, friendOccasions, user]);
  
  // Update countdown timer
  useEffect(() => {
    if (!targetEvent) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const eventDate = targetEvent.date;
      
      // Calculate the time difference
      const days = Math.max(0, differenceInDays(eventDate, now));
      const hours = Math.max(0, differenceInHours(eventDate, now) % 24);
      const minutes = Math.max(0, differenceInMinutes(eventDate, now) % 60);
      const seconds = Math.max(0, differenceInSeconds(eventDate, now) % 60);
      
      setTimeLeft({ days, hours, minutes, seconds });
      
      // If the countdown is over, find the next event
      if (days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 0) {
        // This will trigger the useEffect to find the next event
        if (user) {
          // For logged-in users, refetch both holidays and friend events
          // This would be handled by the dependencies of the first useEffect
        } else {
          // For non-logged in users, just set to the next holiday
          const nextAvailableHoliday = upcomingHolidays.find(h => h.date > now);
          if (nextAvailableHoliday) {
            setTargetEvent({
              name: nextAvailableHoliday.name,
              date: nextAvailableHoliday.date,
              type: nextAvailableHoliday.type
            });
          }
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetEvent, user, upcomingHolidays]);
  
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
            {targetEvent ? (
              <>
                <h1 className="text-3xl font-bold mb-3">
                  {targetEvent.name} is Coming!
                </h1>
                <p className="text-lg mb-4 opacity-90">
                  Find the perfect gifts for {targetEvent.type === "birthday" || targetEvent.type === "anniversary" ? "your loved ones" : "everyone on your list"}. Don't miss out!
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-3">Find the Perfect Gift</h1>
                <p className="text-lg mb-4 opacity-90">
                  Discover thoughtful gifts for every occasion and relationship in your life.
                </p>
              </>
            )}
            
            {/* Countdown timer */}
            {targetEvent && (
              <>
                <div className="flex items-center mb-6 justify-center md:justify-start">
                  <Clock className="mr-2 h-5 w-5" />
                  <span className="text-lg font-medium">Coming up in:</span>
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
              </>
            )}
            
            <div className="flex space-x-4 justify-center md:justify-start">
              <Button className="bg-white text-purple-700 hover:bg-gray-100">
                <Gift className="mr-2 h-4 w-4" />
                Shop Now
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/20">
                View All Gifts
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
