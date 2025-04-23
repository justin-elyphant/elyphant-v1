
import React from "react";
import EventViewToggle from "../EventViewToggle";
import EventTypeFilter from "../EventTypeFilter";
import EventCardsView from "../EventCardsView";
import EventCalendarView from "./CalendarView";
import { useEvents } from "../context/EventsContext";
import { useEventHandlers } from "../hooks/useEventHandlers";
import { FilterOption } from "../types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventsContainerProps {
  onAddEvent?: () => void;
}

const EventsContainer = ({ onAddEvent }: EventsContainerProps) => {
  const { 
    events, 
    viewMode, 
    setViewMode, 
    selectedEventType, 
    setSelectedEventType 
  } = useEvents();
  
  const {
    handleSendGift,
    handleToggleAutoGift,
    handleVerifyEvent,
    handleEditEvent,
    handleEventClick
  } = useEventHandlers();

  // Get unique event types for the filter
  const eventTypes = Array.from(new Set(events.map(event => event.type)));
  
  const handleEventTypeChange = (type: FilterOption) => {
    setSelectedEventType(type);
    console.log(`Filtered to event type: ${type}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <EventViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          
          {viewMode === "cards" && (
            <EventTypeFilter 
              eventTypes={eventTypes} 
              selectedType={selectedEventType}
              onTypeChange={handleEventTypeChange}
            />
          )}
        </div>
        
        <Button onClick={onAddEvent} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>
      
      {viewMode === "cards" ? (
        <EventCardsView 
          events={selectedEventType === "all" 
            ? events 
            : events.filter(event => event.type === selectedEventType)}
          onSendGift={handleSendGift}
          onToggleAutoGift={handleToggleAutoGift}
          onEdit={handleEditEvent}
          onVerifyEvent={handleVerifyEvent}
          onEventClick={handleEventClick}
        />
      ) : (
        <EventCalendarView 
          events={events} 
          onEventClick={handleEventClick}
          onSendGift={handleSendGift}
          onToggleAutoGift={handleToggleAutoGift}
          onVerifyEvent={handleVerifyEvent}
          selectedEventType={selectedEventType}
          onEventTypeChange={handleEventTypeChange}
        />
      )}
    </div>
  );
};

export default EventsContainer;
