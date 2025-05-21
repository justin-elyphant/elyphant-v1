
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
    // Calendar style: horizontal scroll on mobile, grid on desktop, more spacing, light background
    <div
      className="
        flex gap-4 md:gap-6 items-stretch
        overflow-x-auto scrollbar-none md:overflow-x-visible
        py-2 md:py-4
        -mx-4 px-4
        md:grid md:grid-cols-4 md:gap-6 md:px-0 md:mx-0
        animate-fade-in
      "
      style={{
        WebkitOverflowScrolling: "touch",
        background: "linear-gradient(90deg, #f8fafc 0%, #ede9fe 100%)",
        borderRadius: "18px",
        boxShadow: "0 3px 12px 0 rgba(86,76,195,0.03)",
      }}
      data-testid="occasion-cards-scrollable"
    >
      <div className="min-w-[118px] max-w-[170px] w-full flex-shrink-0 md:min-w-0 md:max-w-none">
        <FriendEventCard 
          event={firstEvent} 
          index={0}
          onCardClick={onCardClick}
          compact
        />
      </div>
      <div className="min-w-[118px] max-w-[170px] w-full flex-shrink-0 md:min-w-0 md:max-w-none">
        <FriendEventCard 
          event={secondEvent} 
          index={1}
          fallbackEvent={firstEvent}
          onCardClick={onCardClick}
          compact
        />
      </div>
      <div className="min-w-[118px] max-w-[170px] w-full flex-shrink-0 md:min-w-0 md:max-w-none">
        <HolidayCard 
          holiday={nextHoliday}
          type="holiday"
          onCardClick={onCardClick}
          compact
        />
      </div>
      <div className="min-w-[118px] max-w-[170px] w-full flex-shrink-0 md:min-w-0 md:max-w-none">
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
