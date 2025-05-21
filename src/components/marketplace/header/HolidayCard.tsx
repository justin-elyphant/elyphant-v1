
import React from "react";
import { Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiftOccasion } from "../utils/upcomingOccasions";

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

  // Compact luxury tile style
  const cardClass = compact
    ? "flex flex-col items-center justify-center bg-white border border-gray-100 shadow-subtle rounded-lg transition hover:shadow-lg px-2 pt-4 pb-3 min-h-[120px] max-h-[138px] md:min-h-[120px] md:h-[138px] w-full"
    : "flex flex-col items-center justify-center h-24 border-2 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors";

  return (
    <Button
      variant="outline"
      className={cardClass}
      onClick={handleClick}
      style={{ minWidth: compact ? 120 : undefined, maxWidth: compact ? 170 : undefined }}
      tabIndex={0}
    >
      {type === "holiday" ? (
        <Star className="h-7 w-7 md:h-8 md:w-8 text-amber-500 mb-2" />
      ) : (
        <Gift className="h-7 w-7 md:h-8 md:w-8 text-emerald-500 mb-2" />
      )}
      <span className="font-sans font-semibold text-sm text-gray-900 truncate w-full">
        {holiday
          ? `Shop ${holiday.name}`
          : type === "holiday"
          ? "Holiday"
          : "Thank You"}
      </span>
    </Button>
  );
};

export default HolidayCard;
