import React, { useState } from "react";
import { X, Calendar, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { getNextHoliday } from "@/components/marketplace/utils/upcomingOccasions";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { generateDynamicButtonText, generateSearchQuery } from "./utils/buttonTextUtils";

interface SubtleCountdownBannerProps {
  className?: string;
}

const SubtleCountdownBanner: React.FC<SubtleCountdownBannerProps> = ({ className = "" }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isDismissed, setIsDismissed] = useState(false);
  const nextHoliday = getNextHoliday();
  const { friendOccasions } = useConnectedFriendsSpecialDates();

  // Determine which event to show
  const upcomingFriendEvent = friendOccasions?.[0];
  const targetEvent = user && upcomingFriendEvent ? upcomingFriendEvent : nextHoliday;

  // Check if current search/category is gift-related
  const searchTerm = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const isGiftContext = searchTerm.toLowerCase().includes("gift") || 
                       ["fashion", "beauty", "home", "tech"].includes(category);

  if (isDismissed || !targetEvent || (!isGiftContext && searchTerm && category)) {
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

  // Generate dynamic button text with smarter mobile truncation
  const friendName = upcomingFriendEvent?.personName;
  const fullButtonText = generateDynamicButtonText(targetEvent, !!user, friendName);
  
  // Smarter mobile text logic - keep meaningful holiday names
  const getMobileButtonText = () => {
    if (!isMobile) return fullButtonText;
    
    // For Father's Day and other major holidays, keep the specific text
    if (fullButtonText.includes("Father's Day")) {
      return "Shop Father's Day";
    }
    if (fullButtonText.includes("Mother's Day")) {
      return "Shop Mother's Day";
    }
    if (fullButtonText.includes("Christmas")) {
      return "Shop Christmas";
    }
    if (fullButtonText.includes("Valentine")) {
      return "Shop Valentine's";
    }
    
    // For very long text or friend names, use generic
    if (fullButtonText.length > 25) {
      return "Shop Gifts";
    }
    
    return fullButtonText;
  };

  const buttonText = getMobileButtonText();

  const handleShopClick = () => {
    const query = encodeURIComponent(generateSearchQuery(targetEvent, friendName));
    navigate(`/marketplace?search=${query}`);
  };

  const eventIcon = targetEvent.type === "birthday" || targetEvent.type === "anniversary" 
    ? <Calendar className="h-4 w-4" />
    : <Gift className="h-4 w-4" />;

  return (
    <div className={`w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 ${className}`}>
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between py-2 ${isMobile ? 'gap-2' : 'gap-4'}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {eventIcon}
            <div className="flex-1 min-w-0">
              <div className={`flex items-center gap-2 ${isMobile ? 'flex-col items-start' : ''}`}>
                <span className="font-semibold text-sm text-blue-900">{daysDisplay}</span>
                <span className={`text-blue-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  until {targetEvent.name}
                </span>
                {!isMobile && (
                  <span className="text-blue-600 text-xs">
                    • {format(eventDate, "MMM d")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/80 text-blue-700 border-blue-200 hover:bg-white text-xs px-2 py-1 h-7"
              onClick={handleShopClick}
            >
              <Gift className="h-3 w-3 mr-1" />
              {buttonText}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:bg-blue-100 p-1 h-7 w-7"
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss banner"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubtleCountdownBanner;
