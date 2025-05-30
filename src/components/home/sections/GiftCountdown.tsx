
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
    return <Calendar className="h-7 w-7 text-[#7E69AB]" />;
  // Default for holidays or other types
  return <Gift className="h-7 w-7 text-[#7E69AB]" />;
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

  // Friendly line per occasion
  let detailDisplay = "";
  if (isToday(eventDate)) {
    detailDisplay = `${event.name} is Today!`;
  } else if (isTomorrow(eventDate)) {
    detailDisplay = `${event.name} is Tomorrow (${dateLabel})`;
  } else {
    detailDisplay = `${event.name} is ${dateLabel}`;
  }

  // Button: search for event gifts
  const handleShopGifts = () => {
    const query = encodeURIComponent(`${event.name} gifts`);
    navigate(`/marketplace?search=${query}`);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-4 bg-white/80 border border-gray-200 rounded-xl shadow-sm mb-5 md:mb-6 animate-fade-in max-w-md mx-auto md:mx-0">
      <div className="flex items-center md:items-start md:flex-col gap-3 md:gap-0 mr-2 flex-shrink-0">
        <span>{occasionIcon(event.type)}</span>
      </div>
      <div className="flex flex-col flex-1 min-w-0 items-center md:items-start text-center md:text-left">
        <span className="text-[#7E69AB] font-extrabold text-2xl md:text-3xl leading-tight drop-shadow-sm">
          {daysDisplay}
        </span>
        <span className="mt-1 md:mt-2 text-base font-semibold text-gray-900 truncate">{event.name}</span>
        <span className="text-xs text-gray-500">{dateLabel}</span>
        <span className="mt-1 text-xs text-gray-400">Get ready to celebrate!</span>
      </div>
      <div className="flex mt-2 md:mt-0 md:ml-4 w-full md:w-auto justify-center md:justify-end">
        <Button
          variant="outline"
          size="sm"
          className="whitespace-nowrap text-[#7E69AB] border-[#E6E0F5] hover:bg-[#F7F4FC]"
          onClick={handleShopGifts}
        >
          Shop {event.name} Gifts
        </Button>
      </div>
    </div>
  );
};

export default GiftCountdown;
