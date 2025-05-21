
import React from "react";
import { GiftOccasion } from "../utils/upcomingOccasions";
import CalendarDayCard from "./CalendarDayCard";

interface HolidayCardProps {
  holiday: GiftOccasion | null;
  type: "holiday" | "thank-you";
  onCardClick: (searchQuery: string) => void;
  compact?: boolean;
}

export const HolidayCard: React.FC<HolidayCardProps> = ({
  holiday,
  type,
  onCardClick,
  compact = false,
}) => {
  const handleClick = () => {
    if (holiday) {
      onCardClick(holiday.searchTerm);
    } else {
      onCardClick(type === "holiday" ? "holiday gift" : "thank you gift");
    }
  };

  // If holiday data is missing, fake today
  const date = holiday ? holiday.date : new Date();

  // Title: "Shop Father's Day" or fallback
  const mainLabel = holiday
    ? `Shop ${holiday.name}`
    : type === "holiday"
    ? "Holiday"
    : "Thank You";

  // Accent dot (gold for holiday, green for thank-you, gray fallback)
  let color = "#D1D5DB";
  if (type === "thank-you") color = "#5ECB81";
  if (type === "holiday" && !!holiday) color = "#F8BC58";

  return (
    <CalendarDayCard
      date={date}
      title={mainLabel}
      highlightColor={color}
      onClick={handleClick}
    />
  );
};

export default HolidayCard;
