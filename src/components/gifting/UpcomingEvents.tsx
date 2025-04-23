
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
      <EventsContainer onAddEvent={handleAddEvent} />
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
