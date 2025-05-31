import React from "react";
import { Gift, Calendar } from "lucide-react";
import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface GiftCountdownProps {
  event: {
    name: string;
    date: Date;
    type: string;
  } | null;
}

const occasionIcon = (type: string) => {
  if (type === "birthday" || type === "anniversary")
    return <Calendar className="h-5 w-5 text-white" />;
  // Default for holidays or other types
  return <Gift className="h-5 w-5 text-white" />;
};

const GiftCountdown: React.FC<GiftCountdownProps> = ({ event }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!event) return null;
  
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // Filter out past events
  if (eventDate < now) return null;
  
  const days = differenceInCalendarDays(eventDate, now);
  const dateLabel = format(eventDate, "EEEE, MMMM d");

  // Improved text logic using date-fns helpers
  let daysDisplay = "";
  let isUrgent = false;
  if (isToday(eventDate)) {
    daysDisplay = "Today!";
    isUrgent = true;
  } else if (isTomorrow(eventDate)) {
    daysDisplay = "Tomorrow!";
    isUrgent = true;
  } else {
    daysDisplay = `${days} days away!`;
    isUrgent = days <= 3;
  }

  // Button: search for event gifts
  const handleShopGifts = () => {
    const query = encodeURIComponent(`${event.name} gifts`);
    navigate(`/marketplace?search=${query}`);
  };

  if (isMobile) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 p-4 shadow-lg animate-fade-in">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>
        
        <div className="relative z-10">
          {/* Header with icon and countdown */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                {occasionIcon(event.type)}
              </div>
              <div className="flex flex-col">
                <span className="text-white/90 text-xs font-medium uppercase tracking-wide">
                  Coming up
                </span>
                <span className="text-white font-bold text-lg leading-tight">
                  {event.name}
                </span>
              </div>
            </div>
            
            {/* Prominent countdown badge */}
            <div className={`px-4 py-2 rounded-full ${
              isUrgent 
                ? 'bg-gradient-to-r from-orange-400 to-red-500 shadow-lg' 
                : 'bg-white/20 backdrop-blur-sm'
            } border border-white/30`}>
              <span className={`font-black text-lg ${
                isUrgent ? 'text-white' : 'text-white'
              } drop-shadow-sm`}>
                {daysDisplay}
              </span>
            </div>
          </div>
          
          {/* Date and action */}
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm font-medium">
              {dateLabel}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm font-semibold shadow-sm"
              onClick={handleShopGifts}
            >
              Shop Gifts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop version (keep existing design)
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 animate-fade-in">
      <div className="flex items-center gap-3 flex-shrink-0">
        <span>{occasionIcon(event.type)}</span>
        <div className="flex flex-col min-w-0">
          <span className="text-[#7E69AB] font-extrabold text-lg md:text-xl leading-tight">
            {daysDisplay}
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate">{event.name}</span>
          <span className="text-xs text-gray-500 hidden md:block">{dateLabel}</span>
        </div>
      </div>
      <div className="flex justify-center md:justify-end">
        <Button
          variant="outline"
          size="sm"
          className="whitespace-nowrap text-[#7E69AB] border-[#E6E0F5] hover:bg-[#F7F4FC] text-xs"
          onClick={handleShopGifts}
        >
          Shop Gifts
        </Button>
      </div>
    </div>
  );
};

export default GiftCountdown;
