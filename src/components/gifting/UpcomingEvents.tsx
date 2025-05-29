
import React from "react";
import { EventsProvider } from "./events/context/EventsContext";
import EnhancedEventsContainer from "./events/views/EnhancedEventsContainer";
import EventEditDrawer from "./events/edit-drawer/EventEditDrawer";

interface UpcomingEventsProps {
  onAddEvent: () => void;
}

const UpcomingEvents = ({ onAddEvent }: UpcomingEventsProps) => {
  return (
    <EventsProvider>
      <div className="space-y-6">
        <EnhancedEventsContainer onAddEvent={onAddEvent} />
        <EventEditDrawer />
      </div>
    </EventsProvider>
  );
};

export default UpcomingEvents;
