import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OccasionHorizontalList from "./OccasionHorizontalList";
import { GiftOccasion } from "../utils/upcomingOccasions";
import { GraduationCap } from "lucide-react";

interface OccasionTabsProps {
  friendOccasions: GiftOccasion[];
  upcomingHolidays: GiftOccasion[];
  onCardClick: (searchQuery: string, personId?: string, occasionType?: string) => void;
}

const getHolidayIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("graduation")) return GraduationCap;
  // Only one icon allowed by project config, so everything else:
  return undefined;
};

const OccasionTabs: React.FC<OccasionTabsProps> = ({
  friendOccasions,
  upcomingHolidays,
  onCardClick,
}) => {
  // Upcoming and sorted
  const sortedFriends = [...friendOccasions]
    .filter(e => e && e.date instanceof Date && e.date.getTime() > Date.now())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  const sortedHolidays = [...upcomingHolidays]
    .filter(e => e && e.date instanceof Date && e.date.getTime() > Date.now())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  return (
    <Tabs defaultValue="friends" className="w-full">
      <TabsList className="w-full flex justify-center mb-4">
        <TabsTrigger value="friends" className="flex-1">Friend Events</TabsTrigger>
        <TabsTrigger value="holidays" className="flex-1">Holidays</TabsTrigger>
      </TabsList>
      <TabsContent value="friends">
        {sortedFriends.length > 0 ? (
          <OccasionHorizontalList
            occasions={sortedFriends.map(event => ({
              date: event.date,
              avatarUrl: event.personImage,
              avatarAlt: event.personName ?? "",
              icon: undefined,
              title: `${event.personName.split(" ")[0]}'s ${event.type === "birthday" ? "Birthday" : "Anniv."}`,
              subtitle: event.personName,
              highlightColor: event.type === "birthday" ? "#8B7DFB" : "#C288AE",
              onClick: () => onCardClick(`${event.personName} ${event.type} gift`, event.personId, event.type)
            }))}
            emptyMessage="No upcoming friend events"
          />
        ) : (
          <div className="text-gray-500 text-sm text-center py-8">No upcoming friend events</div>
        )}
      </TabsContent>
      <TabsContent value="holidays">
        {sortedHolidays.length > 0 ? (
          <OccasionHorizontalList
            occasions={sortedHolidays.map(event => ({
              date: event.date,
              avatarUrl: undefined,
              avatarAlt: "",
              icon: getHolidayIcon(event.name),
              title: `Shop ${event.name}`,
              subtitle: "Upcoming Holiday",
              highlightColor: "#F8BC58",
              onClick: () => onCardClick(event.searchTerm)
            }))}
            emptyMessage="No upcoming holidays"
          />
        ) : (
          <div className="text-gray-500 text-sm text-center py-8">No upcoming holidays</div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default OccasionTabs;
