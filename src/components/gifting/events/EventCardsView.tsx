
import React from "react";
import { Badge } from "@/components/ui/badge";
import EventCard from "./EventCard";
import EventPrivacyBadge from "./EventPrivacyBadge";
import { ExtendedEventData } from "./types";

interface EventCardsViewProps {
  events: ExtendedEventData[];
  onSendGift: (id: number) => void;
  onToggleAutoGift: (id: number) => void;
  onEdit: (id: number) => void;
  onVerifyEvent: (id: number) => void;
}

const EventCardsView = ({ 
  events, 
  onSendGift, 
  onToggleAutoGift, 
  onEdit,
  onVerifyEvent
}: EventCardsViewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard 
          key={event.id}
          event={event}
          onSendGift={onSendGift}
          onToggleAutoGift={onToggleAutoGift}
          onEdit={onEdit}
          extraContent={
            <>
              {event.privacyLevel && <EventPrivacyBadge 
                privacyLevel={event.privacyLevel} 
                isVerified={event.isVerified} 
              />}
              {event.needsVerification && (
                <div className="mt-2">
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-amber-50 border-amber-300"
                    onClick={() => onVerifyEvent(event.id)}
                  >
                    Verify Event
                  </Badge>
                </div>
              )}
            </>
          }
        />
      ))}
    </div>
  );
};

export default EventCardsView;
