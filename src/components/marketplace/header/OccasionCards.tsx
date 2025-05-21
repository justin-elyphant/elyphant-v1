
import React from "react";
import { GiftOccasion } from "../utils/upcomingOccasions";
import FriendEventCard from "./FriendEventCard";
import HolidayCard from "./HolidayCard";

interface OccasionCardsProps {
  friendOccasions: GiftOccasion[];
  nextHoliday: GiftOccasion | null;
  secondHoliday: GiftOccasion | null;
  onCardClick: (searchQuery: string, personId?: string, occasionType?: string) => void;
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
    // Horizontal scroll on mobile, centered grid with wrap on desktop
    <div
      className="
        flex gap-3 md:gap-4 items-stretch
        overflow-x-auto scrollbar-none md:overflow-x-visible
        py-1 md:py-2
        -mx-4 px-4
        md:grid md:grid-cols-4 md:gap-4 md:px-0 md:mx-0
      "
      style={{ WebkitOverflowScrolling: "touch" }}
      data-testid="occasion-cards-scrollable"
    >
      <div className="min-w-[136px] max-w-[160px] w-full flex-shrink-0 md:min-w-0 md:max-w-none">
        <FriendEventCard 
          event={firstEvent} 
          index={0}
          onCardClick={onCardClick}
          compact
        />
      </div>
      <div className="min-w-[136px] max-w-[160px] w-full flex-shrink-0 md:min-w-0 md:max-w-none">
        <FriendEventCard 
          event={secondEvent} 
          index={1}
          fallbackEvent={firstEvent}
          onCardClick={onCardClick}
          compact
        />
      </div>
      <div className="min-w-[136px] max-w-[160px] w-full flex-shrink-0 md:min-w-0 md:max-w-none">
        <HolidayCard 
          holiday={nextHoliday}
          type="holiday"
          onCardClick={onCardClick}
          compact
        />
      </div>
      <div className="min-w-[136px] max-w-[160px] w-full flex-shrink-0 md:min-w-0 md:max-w-none">
        <HolidayCard 
          holiday={secondHoliday}
          type="thank-you"
          onCardClick={onCardClick}
          compact
        />
      </div>
    </div>
  );
};

export default OccasionCards;
