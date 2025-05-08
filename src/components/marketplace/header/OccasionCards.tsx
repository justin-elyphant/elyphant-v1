
import React from "react";
import { GiftOccasion } from "../utils/upcomingOccasions";
import FriendEventCard from "./FriendEventCard";
import HolidayCard from "./HolidayCard";

interface OccasionCardsProps {
  friendOccasions: GiftOccasion[];
  nextHoliday: GiftOccasion | null;
  secondHoliday: GiftOccasion | null;
  onCardClick: (searchQuery: string) => void;
}

export const OccasionCards: React.FC<OccasionCardsProps> = ({
  friendOccasions,
  nextHoliday,
  secondHoliday,
  onCardClick
}) => {
  // Get the two closest upcoming friend events (regardless of type)
  const upcomingFriendEvents = [...friendOccasions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstEvent = upcomingFriendEvents.length > 0 ? upcomingFriendEvents[0] : null;
  const secondEvent = upcomingFriendEvents.length > 1 ? upcomingFriendEvents[1] : null;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {/* First Friend Event Card */}
      <FriendEventCard 
        event={firstEvent} 
        index={0}
        onCardClick={onCardClick}
      />
      
      {/* Second Friend Event Card */}
      <FriendEventCard 
        event={secondEvent} 
        index={1}
        fallbackEvent={firstEvent}
        onCardClick={onCardClick}
      />
      
      {/* Holiday Card */}
      <HolidayCard 
        holiday={nextHoliday}
        type="holiday"
        onCardClick={onCardClick}
      />
      
      {/* Thank You / Second Holiday Card */}
      <HolidayCard 
        holiday={secondHoliday}
        type="thank-you"
        onCardClick={onCardClick}
      />
    </div>
  );
};

export default OccasionCards;
