
import React from "react";
import { GiftOccasion } from "../utils/upcomingOccasions";
import CalendarDayCard from "./CalendarDayCard";
import { Gift, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HolidayCardProps {
  holiday: GiftOccasion | null;
  type: "holiday" | "thank-you";
  onCardClick: (searchQuery: string) => void;
  compact?: boolean;
}

// Utility: Decide icon by holiday name/type
function getHolidayIcon(holiday: GiftOccasion | null, type: "holiday" | "thank-you") {
  if (!holiday) {
    if (type === "thank-you") return Gift; // generic gift for thank-you
    return Gift; // default
  }
  const name = holiday.name.toLowerCase();
  // For "father"/"dad", fallback to Gift since Tie is not available
  if (name.includes("father")) return Gift;
  if (name.includes("dad")) return Gift;
  if (name.includes("graduat")) return GraduationCap;
  if (name.includes("grad")) return GraduationCap;
  if (name.includes("thank")) return Gift;
  if (name.includes("gift")) return Gift;
  // Add more holiday-icon mappings as desired
  return Gift; // fallback
}

export const HolidayCard: React.FC<HolidayCardProps> = ({
  holiday,
  type,
  onCardClick,
  compact = false,
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    const searchTerm = holiday ? holiday.searchTerm : (type === "holiday" ? "holiday gift" : "thank you gift");
    
    // Navigate directly to marketplace with the search term, marking it as from occasion
    navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`, { 
      state: { fromOccasion: true }
    });
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

  // Pick icon for the holiday card
  const IconComponent = getHolidayIcon(holiday, type);

  return (
    <CalendarDayCard
      date={date}
      title={mainLabel}
      highlightColor={color}
      onClick={handleClick}
      icon={IconComponent}
    />
  );
};

export default HolidayCard;
