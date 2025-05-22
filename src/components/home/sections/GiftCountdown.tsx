
import React from "react";
import { Gift, Calendar } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface GiftCountdownProps {
  event: {
    name: string;
    date: Date;
    type: string;
  } | null;
  // Optional: any extra onClick or CTA can be added here
}

const occasionIcon = (type: string) => {
  if (type === "birthday") return <Calendar className="h-6 w-6 text-[#7E69AB]" />;
  if (type === "anniversary") return <Calendar className="h-6 w-6 text-[#7E69AB]" />;
  // Default for holidays or anything else:
  return <Gift className="h-6 w-6 text-[#7E69AB]" />;
};

const GiftCountdown: React.FC<GiftCountdownProps> = ({ event }) => {
  const navigate = useNavigate();

  if (!event) return null;
  const now = new Date();
  const days = Math.max(0, differenceInDays(event.date, now));
  const dateLabel = format(event.date, "EEEE, MMMM d");

  // Friendly message per occasion
  let display;
  if (days === 0) display = `${event.name} is Today!`;
  else if (days === 1) display = `${event.name} is Tomorrow (${dateLabel})`;
  else display = `${event.name} is ${dateLabel} – ${days} days away!`;

  // Button handler: navigate to marketplace with search query for event
  const handleShopGifts = () => {
    // Compose a search query that's relevant to the event (e.g., "father's day gifts")
    const query = encodeURIComponent(`${event.name} gifts`);
    navigate(`/marketplace?search=${query}`);
  };

  return (
    <div className="flex flex-col items-center md:flex-row md:items-center gap-3 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl shadow-sm mb-5 md:mb-6 animate-fade-in max-w-md mx-auto md:mx-0">
      <div className="flex-shrink-0">
        {occasionIcon(event.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base md:text-lg font-semibold text-[#7E69AB]">{display}</div>
        <div className="text-xs text-gray-500">Get ready to celebrate!</div>
      </div>
      {/* Subtle shop gifts button */}
      <Button
        variant="outline"
        size="sm"
        className="whitespace-nowrap text-[#7E69AB] border-[#E6E0F5] hover:bg-[#F7F4FC]"
        onClick={handleShopGifts}
      >
        Shop {event.name} Gifts
      </Button>
    </div>
  );
};

export default GiftCountdown;

