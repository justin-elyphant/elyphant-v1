
import React, { useState } from "react";
import { X, Calendar, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { getNextHoliday } from "@/components/marketplace/utils/upcomingOccasions";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { generateDynamicButtonText, generateSearchQuery } from "./utils/buttonTextUtils";

interface CountdownBannerProps {
  className?: string;
}

const CountdownBanner: React.FC<CountdownBannerProps> = ({ className = "" }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const nextHoliday = getNextHoliday();
  const { friendOccasions } = useConnectedFriendsSpecialDates();

  // Determine which event to show
  const upcomingFriendEvent = friendOccasions?.[0];
  const targetEvent = user && upcomingFriendEvent ? upcomingFriendEvent : nextHoliday;

  if (isDismissed || !targetEvent) {
    return null;
  }

  const eventDate = new Date(targetEvent.date);
  const days = differenceInCalendarDays(eventDate, new Date());
  
  let daysDisplay = "";
  if (isToday(eventDate)) {
    daysDisplay = "Today!";
  } else if (isTomorrow(eventDate)) {
    daysDisplay = "Tomorrow!";
  } else {
    daysDisplay = `${days} days`;
  }

  // Generate dynamic button text
  const friendName = upcomingFriendEvent?.friendName;
  const buttonText = generateDynamicButtonText(targetEvent, !!user, friendName);

  const handleShopClick = () => {
    const query = encodeURIComponent(generateSearchQuery(targetEvent, friendName));
    navigate(`/marketplace?search=${query}`);
  };

  const eventIcon = targetEvent.type === "birthday" || targetEvent.type === "anniversary" 
    ? <Calendar className="h-5 w-5" />
    : <Gift className="h-5 w-5" />;

  return (
    <div className={`w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white ${className}`}>
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between py-3 ${isMobile ? 'gap-2' : 'gap-4'}`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {eventIcon}
            <div className="flex-1 min-w-0">
              <div className={`flex items-center gap-2 ${isMobile ? 'flex-col items-start' : ''}`}>
                <span className="font-bold text-lg">{daysDisplay}</span>
                <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
                  until {targetEvent.name}
                </span>
                {!isMobile && (
                  <span className="text-purple-100 text-sm">
                    • {format(eventDate, "MMM d")}
                  </span>
                )}
              </div>
              {isMobile && (
                <span className="text-purple-100 text-xs">
                  {format(eventDate, "EEEE, MMM d")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size={isMobile ? "sm" : "default"}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30 whitespace-nowrap"
              onClick={handleShopClick}
            >
              <Gift className="h-4 w-4 mr-1" />
              {buttonText}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-1"
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownBanner;
