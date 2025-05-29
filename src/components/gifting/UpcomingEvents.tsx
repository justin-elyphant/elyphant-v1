
import React from "react";
import { EventsProvider } from "./events/context/EventsContext";
import EnhancedEventsContainer from "./events/views/EnhancedEventsContainer";
import EventEditDrawer from "./events/edit-drawer/EventEditDrawer";
import { useEvents } from "./events/context/EventsContext";

interface UpcomingEventsProps {
  onAddEvent: () => void;
}

const UpcomingEventsContent = ({ onAddEvent }: UpcomingEventsProps) => {
  const { editingEvent, setEditingEvent, updateEvent } = useEvents();

  const handleSaveEvent = async (eventId: string, updates: any) => {
    await updateEvent(eventId, updates);
    setEditingEvent(null);
  };

  return (
    <div className="space-y-6">
      <EnhancedEventsContainer onAddEvent={onAddEvent} />
      <EventEditDrawer 
        event={editingEvent}
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
        onSave={handleSaveEvent}
      />
    </div>
  );
};

const UpcomingEvents = ({ onAddEvent }: UpcomingEventsProps) => {
  return (
    <EventsProvider>
      <UpcomingEventsContent onAddEvent={onAddEvent} />
    </EventsProvider>
  );
};

export default UpcomingEvents;
