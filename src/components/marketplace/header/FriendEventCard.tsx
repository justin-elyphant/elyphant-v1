
import React from "react";
import { Cake, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { GiftOccasion } from "../utils/upcomingOccasions";

interface FriendEventCardProps {
  event: GiftOccasion | null;
  index: number;
  fallbackEvent?: GiftOccasion | null;
  onCardClick: (searchQuery: string) => void;
}

export const FriendEventCard: React.FC<FriendEventCardProps> = ({
  event,
  index,
  fallbackEvent,
  onCardClick
}) => {
  const handleClick = () => {
    if (event) {
      onCardClick(`${event.personName} ${event.type} gift`);
    } else if (fallbackEvent) {
      // If we have at least one event but not two, use a generic search for the event type
      onCardClick(`${fallbackEvent.type} gift`);
    } else {
      // Fallback
      const fallbackType = index === 0 ? "birthday" : "anniversary";
      onCardClick(`${fallbackType} gift`);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="flex flex-col items-center justify-center h-24 border-2 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center mb-2 relative">
        {event ? (
          event.type === "birthday" ? (
            <Cake className="h-8 w-8 text-indigo-500" />
          ) : (
            <Heart className="h-8 w-8 text-rose-500" />
          )
        ) : (
          index === 0 ? (
            <Cake className="h-8 w-8 text-indigo-500" />
          ) : (
            <Heart className="h-8 w-8 text-rose-500" />
          )
        )}
        {event?.personImage && (
          <div className="absolute -right-4 -top-2">
            <Avatar className="h-6 w-6 border border-white">
              <img src={event.personImage} alt={event.personName} />
            </Avatar>
          </div>
        )}
      </div>
      <span className="font-medium text-sm text-center">
        {event 
          ? `${event.personName}'s ${event.type}` 
          : (fallbackEvent 
            ? `${fallbackEvent.type === "birthday" ? "Anniversary" : "Birthday"}`
            : (index === 0 ? "Birthday" : "Anniversary"))}
      </span>
    </Button>
  );
};

export default FriendEventCard;
