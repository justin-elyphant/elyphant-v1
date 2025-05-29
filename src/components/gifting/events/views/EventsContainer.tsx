
import React, { useState } from "react";
import { useEvents } from "../context/EventsContext";
import { useEventHandlers } from "../hooks/useEventHandlers";
import EventHeader from "../EventHeader";
import EventCardsView from "../EventCardsView";
import CalendarView from "./CalendarView";
import { FilterOption } from "../types";

interface EventsContainerProps {
  onAddEvent: () => void;
}

const EventsContainer = ({ onAddEvent }: EventsContainerProps) => {
  const [view, setView] = useState<"cards" | "calendar">("cards");
  const [selectedEventType, setSelectedEventType] = useState<FilterOption>("all");
  
  const { events, isLoading } = useEvents();
  const { 
    handleSendGift, 
    handleToggleAutoGift, 
    handleEditEvent, 
    handleVerifyEvent,
    handleDeleteEvent 
  } = useEventHandlers();

  // Filter events based on selected type
  const filteredEvents = selectedEventType === "all" 
    ? events 
    : events.filter(event => event.type === selectedEventType);

  // Get unique event types for filter
  const eventTypes = Array.from(new Set(events.map(event => event.type)));

  const handleEventClick = (event: any) => {
    handleEditEvent(event.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EventHeader 
        view={view}
        onViewChange={setView}
        onAddEvent={onAddEvent}
        eventTypes={eventTypes}
        selectedEventType={selectedEventType}
        onEventTypeChange={setSelectedEventType}
      />
      
      {view === "cards" ? (
        <EventCardsView
          events={filteredEvents}
          onSendGift={handleSendGift}
          onToggleAutoGift={handleToggleAutoGift}
          onEdit={handleEditEvent}
          onVerifyEvent={handleVerifyEvent}
          onEventClick={handleEventClick}
        />
      ) : (
        <CalendarView
          events={filteredEvents}
          onSendGift={handleSendGift}
          onToggleAutoGift={handleToggleAutoGift}
          onEdit={handleEditEvent}
          onVerifyEvent={handleVerifyEvent}
          onEventClick={handleEventClick}
          onDelete={handleDeleteEvent}
          eventTypes={eventTypes}
          selectedEventType={selectedEventType}
          onEventTypeChange={setSelectedEventType}
        />
      )}
    </div>
  );
};

export default EventsContainer;
