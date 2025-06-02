
import React from "react";
import { Gift, Calendar } from "lucide-react";
import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns";

interface CompactCountdownProps {
  event: {
    name: string;
    date: Date;
    type: string;
  };
  className?: string;
}

const CompactCountdown: React.FC<CompactCountdownProps> = ({ event, className = "" }) => {
  const now = new Date();
  const eventDate = new Date(event.date);
  const days = differenceInCalendarDays(eventDate, now);

  // Get display text
  let daysDisplay = "";
  let subText = "";
  if (isToday(eventDate)) {
    daysDisplay = "Today!";
  } else if (isTomorrow(eventDate)) {
    daysDisplay = "Tomorrow!";
  } else {
    daysDisplay = `${days}`;
    subText = "days to go!";
  }

  const occasionIcon = event.type === "birthday" || event.type === "anniversary" 
    ? <Calendar className="h-4 w-4" />
    : <Gift className="h-4 w-4" />;

  return (
    <div className={`inline-flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-white/20 ${className}`}>
      {/* Circular countdown - made larger and adjusted text */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex flex-col items-center justify-center text-white font-bold shadow-lg animate-pulse">
          {isToday(eventDate) || isTomorrow(eventDate) ? (
            <Gift className="h-6 w-6" />
          ) : (
            <>
              <span className="text-lg leading-none">{daysDisplay}</span>
              {subText && <span className="text-xs leading-none">days</span>}
            </>
          )}
        </div>
      </div>

      {/* Event info */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1 text-purple-700">
          {occasionIcon}
          <span className="font-semibold text-sm">
            {isToday(eventDate) || isTomorrow(eventDate) ? daysDisplay : subText}
          </span>
        </div>
        <span className="text-gray-800 font-medium text-sm">{event.name}</span>
        <span className="text-gray-500 text-xs">{format(eventDate, "MMM d")}</span>
      </div>
    </div>
  );
};

export default CompactCountdown;
