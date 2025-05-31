
import React from "react";
import { Gift, Calendar } from "lucide-react";
import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface GiftCountdownProps {
  event: {
    name: string;
    date: Date;
    type: string;
  } | null;
}

const occasionIcon = (type: string) => {
  if (type === "birthday" || type === "anniversary")
    return <Calendar className="h-5 w-5 text-[#7E69AB]" />;
  // Default for holidays or other types
  return <Gift className="h-5 w-5 text-[#7E69AB]" />;
};

const GiftCountdown: React.FC<GiftCountdownProps> = ({ event }) => {
  const navigate = useNavigate();

  if (!event) return null;
  
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // Filter out past events
  if (eventDate < now) return null;
  
  const days = differenceInCalendarDays(eventDate, now);
  const dateLabel = format(eventDate, "EEEE, MMMM d");

  // Improved text logic using date-fns helpers
  let daysDisplay = "";
  if (isToday(eventDate)) {
    daysDisplay = "Today!";
  } else if (isTomorrow(eventDate)) {
    daysDisplay = "Tomorrow!";
  } else {
    daysDisplay = `${days} days away!`;
  }

  // Button: search for event gifts
  const handleShopGifts = () => {
    const query = encodeURIComponent(`${event.name} gifts`);
    navigate(`/marketplace?search=${query}`);
  };

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
