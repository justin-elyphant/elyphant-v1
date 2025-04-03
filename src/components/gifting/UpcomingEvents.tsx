
import React from "react";
import EventHeader from "./events/EventHeader";
import EventEditDrawer from "./events/edit-drawer/EventEditDrawer";
import EventsContainer from "./events/views/EventsContainer";
import { EventsProvider, useEvents } from "./events/context/EventsContext";
import { useEventHandlers } from "./events/hooks/useEventHandlers";

interface UpcomingEventsProps {
  onAddEvent?: () => void;
}

// Create a component to handle the drawer
const EventEditDrawerContainer = () => {
  const { currentEvent, isEditDrawerOpen, setIsEditDrawerOpen } = useEvents();
  const { handleSaveEvent } = useEventHandlers();

  return (
    <EventEditDrawer 
      event={currentEvent}
      open={isEditDrawerOpen}
      onOpenChange={setIsEditDrawerOpen}
      onSave={handleSaveEvent}
    />
  );
};

const UpcomingEventsContent = ({ onAddEvent }: UpcomingEventsProps) => {
  const handleAddEvent = () => {
    if (onAddEvent) {
      onAddEvent();
    } else {
      console.log("Add new event");
      // Default implementation for adding a new event
    }
  };

  return (
    <div>
      <EventHeader title="Upcoming Gift Occasions" onAddEvent={handleAddEvent} />
      
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Manage important dates and automate gift-giving. Shared events can be verified by connected users for accuracy.
        </p>
      </div>
      
      <EventsContainer />
      <EventEditDrawerContainer />
    </div>
  );
};

// Main component that provides the context
const UpcomingEvents = (props: UpcomingEventsProps) => {
  return (
    <EventsProvider>
      <UpcomingEventsContent {...props} />
    </EventsProvider>
  );
};

export default UpcomingEvents;
