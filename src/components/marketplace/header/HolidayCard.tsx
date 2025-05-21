import React from "react";
import { Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // Color: gold for holiday, green for thank-you
  let color = "#F8BC58";
  if (type === "thank-you") color = "#5ECB81";
  if (!holiday && type === "holiday") color = "#B6A5FF";

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
