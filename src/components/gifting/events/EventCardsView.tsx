
import React from "react";
import EventCard from "./EventCard";
import { ExtendedEventData } from "./types";

interface EventCardsViewProps {
  events: ExtendedEventData[];
  onSendGift: (id: number) => void;
  onToggleAutoGift: (id: number) => void;
  onEdit: (id: number) => void;
  onVerifyEvent: (id: number) => void;
  onEventClick?: (event: ExtendedEventData) => void; // Add this prop
}

const EventCardsView = ({
  events,
  onSendGift,
  onToggleAutoGift,
  onEdit,
  onVerifyEvent,
  onEventClick,
}: EventCardsViewProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.length === 0 ? (
        <div className="col-span-full text-center py-12 bg-white rounded-md shadow-sm">
          <h3 className="text-lg font-medium mb-2">No events found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or add a new event
          </p>
        </div>
      ) : (
        events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onSendGift={() => onSendGift(event.id)}
            onToggleAutoGift={() => onToggleAutoGift(event.id)}
            onEdit={() => onEdit(event.id)}
            onVerifyEvent={() => onVerifyEvent(event.id)}
            onClick={() => onEventClick && onEventClick(event)} // Add click handler to the card
          />
        ))
      )}
    </div>
  );
};

export default EventCardsView;
