
import React from "react";
import { Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiftOccasion } from "../utils/upcomingOccasions";

interface HolidayCardProps {
  holiday: GiftOccasion | null;
  type: "holiday" | "thank-you";
  onCardClick: (searchQuery: string) => void;
}

export const HolidayCard: React.FC<HolidayCardProps> = ({
  holiday,
  type,
  onCardClick
}) => {
  const handleClick = () => {
    if (holiday) {
      onCardClick(holiday.searchTerm);
    } else {
      onCardClick(type === "holiday" ? "holiday gift" : "thank you gift");
    }
  };

  return (
    <Button 
      variant="outline" 
      className="flex flex-col items-center justify-center h-24 border-2 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors"
      onClick={handleClick}
    >
      {type === "holiday" ? (
        <Star className="h-8 w-8 text-amber-500 mb-2" />
      ) : (
        <Gift className="h-8 w-8 text-emerald-500 mb-2" />
      )}
      <span className="font-medium text-sm text-gray-800 group-hover:text-gray-900">
        {holiday 
          ? `Shop ${holiday.name}` 
          : (type === "holiday" ? "Holiday" : "Thank You")}
      </span>
    </Button>
  );
};

export default HolidayCard;
