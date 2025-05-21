
import React from "react";
import { Cake, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { GiftOccasion } from "../utils/upcomingOccasions";

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

  // Compact style for marketplace scrollable tiles (luxury look, home-style)
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
      <div className="flex items-center justify-center mb-2 relative">
        {event ? (
          event.type === "birthday" ? (
            <Cake className="h-7 w-7 md:h-8 md:w-8 text-indigo-500" />
          ) : (
            <Heart className="h-7 w-7 md:h-8 md:w-8 text-rose-500" />
          )
        ) : index === 0 ? (
          <Cake className="h-7 w-7 md:h-8 md:w-8 text-indigo-500" />
        ) : (
          <Heart className="h-7 w-7 md:h-8 md:w-8 text-rose-500" />
        )}
        {event?.personImage && (
          <div className="absolute -right-4 -top-2">
            <Avatar className="h-6 w-6 border border-white shadow">
              <img src={event.personImage} alt={event.personName} />
            </Avatar>
          </div>
        )}
      </div>
      <span className="font-sans font-semibold text-sm text-center text-gray-900 truncate w-full">
        {event
          ? `${event.personName}'s ${event.type.charAt(0).toUpperCase() + event.type.slice(1)}`
          : fallbackEvent
          ? `${fallbackEvent.type === "birthday" ? "Anniversary" : "Birthday"}`
          : index === 0
          ? "Birthday"
          : "Anniversary"}
      </span>
    </Button>
  );
};

export default FriendEventCard;
