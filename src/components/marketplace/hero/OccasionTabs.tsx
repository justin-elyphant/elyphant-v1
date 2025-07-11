
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OccasionHorizontalList from "./OccasionHorizontalList";
import { GiftOccasion } from "../utils/upcomingOccasions";
import { GraduationCap, Gift, Heart, Beer, Glasses } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OccasionTabsProps {
  friendOccasions: GiftOccasion[];
  upcomingHolidays: GiftOccasion[];
  onCardClick: (searchQuery: string, personId?: string, occasionType?: string) => void;
}

// Try to map common holidays to distinct icons
const getHolidayIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("graduation")) return GraduationCap;
  if (lower.includes("father")) return Gift; // Changed to use Gift icon for Father's Day
  if (lower.includes("valentine")) return Heart;
  if (lower.includes("oktober")) return Beer;
  // Fallback: present box for all others (Gift icon)
  return Gift;
};

const OccasionTabs: React.FC<OccasionTabsProps> = ({
  friendOccasions,
  upcomingHolidays,
  onCardClick,
}) => {
  const navigate = useNavigate();
  
  // Upcoming and sorted
  const sortedFriends = [...friendOccasions]
    .filter(e => e && e.date instanceof Date && e.date.getTime() > Date.now())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  const sortedHolidays = [...upcomingHolidays]
    .filter(e => e && e.date instanceof Date && e.date.getTime() > Date.now())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  // Updated holiday click handler to navigate directly and mark as system-generated
  const handleHolidayClick = (searchTerm: string) => {
    // Navigate directly to marketplace with the search term, marking it as from occasion
    navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`, { 
      state: { fromOccasion: true }
    });
  };

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
              onClick: () => handleHolidayClick(event.searchTerm)
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
