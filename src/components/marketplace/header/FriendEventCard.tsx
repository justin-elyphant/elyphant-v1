
import React from "react";
import { GiftOccasion } from "../utils/upcomingOccasions";
import CalendarDayCard from "./CalendarDayCard";

interface FriendEventCardProps {
  event: GiftOccasion | null;
  index: number;
  fallbackEvent?: GiftOccasion | null;
  onCardClick: (searchQuery: string, personId?: string, occasionType?: string) => void;
  compact?: boolean;
}

export const FriendEventCard: React.FC<FriendEventCardProps> = ({
  event,
  index,
  fallbackEvent,
  onCardClick,
  compact = false,
}) => {
  const handleClick = () => {
    if (event) {
      onCardClick(
        `${event.personName} ${event.type} gift`,
        event.personId,
        event.type
      );
    } else if (fallbackEvent) {
      onCardClick(`${fallbackEvent.type} gift`);
    } else {
      const fallbackType = index === 0 ? "birthday" : "anniversary";
      onCardClick(`${fallbackType} gift`);
    }
  };

  // Dates to show (today for unknown)
  const date = event ? event.date : new Date();
  const avatarUrl = event?.personImage;
  const avatarAlt = event?.personName ?? "";

  // Title: Emma's Birthday, or fallback
  const mainLabel = event
    ? `${event.personName.split(" ")[0]}'s ${event.type === "birthday" ? "Birthday" : "Anniv."}`
    : fallbackEvent
    ? `${fallbackEvent.type === "birthday" ? "Anniversary" : "Birthday"}`
    : index === 0
    ? "Birthday"
    : "Anniversary";

  // Tiny accent color as dot (purple for birthday, pink for anniv, gray for fallback)
  let color = "#D1D5DB";
  if (event?.type === "birthday") color = "#8B7DFB";
  if (event?.type === "anniversary") color = "#C288AE";
  if (!event && index === 1) color = "#C288AE"; // fallback anniv
  if (!event && index === 0) color = "#8B7DFB"; // fallback birthday

  return (
    <CalendarDayCard
      date={date}
      title={mainLabel}
      avatarUrl={avatarUrl}
      avatarAlt={avatarAlt}
      highlightColor={color}
      onClick={handleClick}
    />
  );
};

export default FriendEventCard;
