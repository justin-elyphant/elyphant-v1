
import React from "react";
import { GiftOccasion } from "../utils/upcomingOccasions";
import OccasionListItem from "./OccasionListItem";
import { Gift, GraduationCap } from "lucide-react";

interface OccasionCardsProps {
  friendOccasions: GiftOccasion[];
  nextHoliday: GiftOccasion | null;
  secondHoliday: GiftOccasion | null;
  onCardClick: (searchQuery: string, personId?: string, occasionType?: string) => void;
}

// Utility to pick an icon for holidays (from your previous code)
function getHolidayIcon(holiday: GiftOccasion | null, type: "holiday" | "thank-you") {
  if (!holiday) {
    if (type === "thank-you") return Gift;
    return Gift;
  }
  const name = holiday.name.toLowerCase();
  if (name.includes("father")) return Gift;
  if (name.includes("dad")) return Gift;
  if (name.includes("graduat")) return GraduationCap;
  if (name.includes("grad")) return GraduationCap;
  if (name.includes("thank")) return Gift;
  if (name.includes("gift")) return Gift;
  return Gift;
}

export const OccasionCards: React.FC<OccasionCardsProps> = ({
  friendOccasions,
  nextHoliday,
  secondHoliday,
  onCardClick
}) => {
  // Two closest upcoming friend events (regardless of type)
  const upcomingFriendEvents = [...friendOccasions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstEvent = upcomingFriendEvents.length > 0 ? upcomingFriendEvents[0] : null;
  const secondEvent = upcomingFriendEvents.length > 1 ? upcomingFriendEvents[1] : null;

  // Build items array for rendering in order
  const listItems = [
    firstEvent && {
      kind: "friend" as const,
      event: firstEvent,
      index: 0
    },
    secondEvent && {
      kind: "friend" as const,
      event: secondEvent,
      index: 1,
      fallbackEvent: firstEvent
    },
    { kind: "holiday" as const, event: nextHoliday, type: "holiday" },
    { kind: "holiday" as const, event: secondHoliday, type: "thank-you" }
  ].filter(Boolean);

  return (
    <div
      className="
        flex gap-4 md:gap-6 items-stretch
        overflow-x-auto scrollbar-none md:overflow-x-visible
        py-2 md:py-4
        -mx-2 px-2
        md:flex-col md:gap-3 md:px-0 md:mx-0
        animate-fade-in
        bg-gradient-to-r from-slate-50 via-indigo-50 to-purple-50
        rounded-xl
      "
      style={{
        WebkitOverflowScrolling: "touch",
        boxShadow: "0 3px 12px 0 rgba(86,76,195,0.03)"
      }}
      data-testid="occasion-cards-list"
    >
      {/* Render each occasion as a row */}
      {listItems.map((item, i) => {
        if (item.kind === "friend") {
          // Birthday: purple, Anniv: pink
          let color = "#D1D5DB";
          if (item.event.type === "birthday") color = "#8B7DFB";
          if (item.event.type === "anniversary") color = "#C288AE";
          const mainLabel = `${item.event.personName.split(" ")[0]}'s ${item.event.type === "birthday" ? "Birthday" : "Anniv."}`;
          return (
            <div key={`friend-${i}`} className="min-w-[260px] max-w-[300px]">
              <OccasionListItem
                date={item.event.date}
                avatarUrl={item.event.personImage}
                avatarAlt={item.event.personName}
                title={mainLabel}
                subtitle={item.event.personName}
                highlightColor={color}
                onClick={() =>
                  onCardClick(
                    `${item.event.personName} ${item.event.type} gift`,
                    item.event.personId,
                    item.event.type
                  )
                }
              />
            </div>
          );
        }
        // Holiday or thank-you
        let color = "#D1D5DB";
        if (item.type === "thank-you") color = "#5ECB81";
        if (item.type === "holiday" && !!item.event) color = "#F8BC58";
        const mainLabel = item.event
          ? `Shop ${item.event.name}`
          : item.type === "holiday"
            ? "Holiday"
            : "Thank You";
        const IconComponent =
          getHolidayIcon(item.event, item.type as "holiday" | "thank-you");
        return (
          <div key={`holiday-${i}`} className="min-w-[260px] max-w-[300px]">
            <OccasionListItem
              date={item.event ? item.event.date : new Date()}
              icon={IconComponent}
              title={mainLabel}
              subtitle={item.type === "holiday" ? "Upcoming Holiday" : "Thank You"}
              highlightColor={color}
              onClick={() =>
                onCardClick(
                  item.event
                    ? item.event.searchTerm
                    : item.type === "holiday"
                      ? "holiday gift"
                      : "thank you gift"
                )
              }
            />
          </div>
        );
      })}
    </div>
  );
};

export default OccasionCards;
