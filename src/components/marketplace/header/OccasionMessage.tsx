
import React from "react";
import { Cake, Heart, Gift } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { GiftOccasion } from "../utils/upcomingOccasions";

interface OccasionMessageProps {
  occasion: GiftOccasion | null;
  animationState: "in" | "out";
}

export const OccasionMessage: React.FC<OccasionMessageProps> = ({ 
  occasion, 
  animationState 
}) => {
  if (!occasion) return null;

  // Get appropriate icon for occasion type
  const getOccasionIcon = (occasion: GiftOccasion) => {
    switch (occasion.type) {
      case 'birthday': 
        return <Cake className="h-5 w-5 mr-2 text-purple-500" />;
      case 'anniversary': 
        return <Heart className="h-5 w-5 mr-2 text-rose-500" />;
      default: 
        return <Gift className="h-5 w-5 mr-2 text-indigo-500" />;
    }
  };

  // Format message about the occasion
  const formatOccasionMessage = (occasion: GiftOccasion) => {
    const daysRemaining = differenceInDays(occasion.date, new Date());
    const formattedDate = format(occasion.date, "EEEE, M/d");
    
    if (daysRemaining === 0) {
      return `${occasion.name} is Today!`;
    } else if (daysRemaining === 1) {
      return `${occasion.name} is Tomorrow, ${formattedDate}`;
    } else {
      return `${occasion.name} is ${formattedDate} – ${daysRemaining} days away!`;
    }
  };

  return (
    <div className={`flex items-center text-gray-700 font-medium transition-opacity duration-500 ${
      animationState === "in" ? "opacity-100" : "opacity-0"
    }`}>
      {getOccasionIcon(occasion)}
      <span>{formatOccasionMessage(occasion)}</span>
    </div>
  );
};

export default OccasionMessage;
