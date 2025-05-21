
import React from "react";
import { Gift, Calendar } from "lucide-react";
import { differenceInDays, format } from "date-fns";

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
  if (!event) return null;
  const now = new Date();
  const days = Math.max(0, differenceInDays(event.date, now));
  const dateLabel = format(event.date, "EEEE, MMMM d");

  // Friendly message per occasion
  let display;
  if (days === 0) display = `${event.name} is Today!`;
  else if (days === 1) display = `${event.name} is Tomorrow (${dateLabel})`;
  else display = `${event.name} is ${dateLabel} – ${days} days away!`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl shadow-sm mb-5 md:mb-6 animate-fade-in max-w-md mx-auto md:mx-0">
      <div className="flex-shrink-0">
        {occasionIcon(event.type)}
      </div>
      <div>
        <div className="text-base md:text-lg font-semibold text-[#7E69AB]">{display}</div>
        <div className="text-xs text-gray-500">Get ready to celebrate!</div>
      </div>
    </div>
  );
};

export default GiftCountdown;
