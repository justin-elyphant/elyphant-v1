
import React from "react";
import EventCard from "./EventCard";
import { ExtendedEventData } from "./types";

interface EventCardsViewProps {
  events: ExtendedEventData[];
  onSendGift: (id: string) => void;
  onToggleAutoGift: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onVerifyEvent: (id: string) => void;
  onEventClick?: (event: ExtendedEventData) => void;
}

const EventCardsView = ({
  events,
  onSendGift,
  onToggleAutoGift,
  onEdit,
  onDelete,
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
            onDelete={() => onDelete(event.id)}
            onVerifyEvent={() => onVerifyEvent(event.id)}
            onClick={() => onEventClick && onEventClick(event)}
          />
        ))
      )}
    </div>
  );
};

export default EventCardsView;
