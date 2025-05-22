
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FriendEventCard from "../header/FriendEventCard";
import HolidayCard from "../header/HolidayCard";
import { GiftOccasion } from "../utils/upcomingOccasions";

// Props
interface OccasionTabsProps {
  friendOccasions: GiftOccasion[];
  upcomingHolidays: GiftOccasion[];
  onCardClick: (searchQuery: string, personId?: string, occasionType?: string) => void;
}

const OccasionTabs: React.FC<OccasionTabsProps> = ({
  friendOccasions,
  upcomingHolidays,
  onCardClick,
}) => {
  // Top 3 sorted upcoming for each
  const sortedFriends = [...friendOccasions]
    .filter(e => e && e.date instanceof Date && e.date.getTime() > Date.now())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  const sortedHolidays = [...upcomingHolidays]
    .filter(e => e && e.date instanceof Date && e.date.getTime() > Date.now())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  return (
    <Tabs defaultValue="friends" className="w-full">
      <TabsList className="w-full flex justify-center mb-4">
        <TabsTrigger value="friends" className="flex-1">Friend Events</TabsTrigger>
        <TabsTrigger value="holidays" className="flex-1">Holidays</TabsTrigger>
      </TabsList>
      <TabsContent value="friends">
        <div className="flex flex-col gap-4">
          {sortedFriends.length > 0 ? (
            sortedFriends.map((event, idx) => (
              <FriendEventCard
                key={event.id || idx}
                event={event}
                index={idx}
                onCardClick={onCardClick}
                compact={true}
              />
            ))
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">No upcoming friend events</div>
          )}
        </div>
      </TabsContent>
      <TabsContent value="holidays">
        <div className="flex flex-col gap-4">
          {sortedHolidays.length > 0 ? (
            sortedHolidays.map((holiday, idx) => (
              <HolidayCard
                key={holiday.id || idx}
                holiday={holiday}
                type="holiday"
                onCardClick={onCardClick}
                compact={true}
              />
            ))
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">No upcoming holidays</div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default OccasionTabs;
