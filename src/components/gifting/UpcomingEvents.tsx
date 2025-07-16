
import React from "react";
import { EventsProvider } from "./events/context/EventsContext";
import EnhancedEventsContainer from "./events/views/EnhancedEventsContainer";
import EventEditDrawer from "./events/edit-drawer/EventEditDrawer";
import { GiftSetupWizard } from "./GiftSetupWizard";
import { useEvents } from "./events/context/EventsContext";

interface UpcomingEventsProps {
  onAddEvent: () => void;
}

const UpcomingEventsContent = ({ onAddEvent }: UpcomingEventsProps) => {
  const { 
    editingEvent, 
    setEditingEvent, 
    updateEvent, 
    deleteEvent,
    isGiftWizardOpen,
    setIsGiftWizardOpen,
    editingEventData,
    setEditingEventData,
    refreshEvents
  } = useEvents();

  const handleSaveEvent = async (eventId: string, updates: any) => {
    await updateEvent(eventId, updates);
    setEditingEvent(null);
  };

  const handleDeleteEvent = async (eventId: string, options: any) => {
    await deleteEvent(eventId, options);
    setEditingEvent(null);
  };

  const handleGiftWizardClose = () => {
    setIsGiftWizardOpen(false);
    setEditingEventData(null);
  };

  const handleGiftWizardComplete = async () => {
    // Refresh events after wizard completion
    await refreshEvents();
    handleGiftWizardClose();
  };

  return (
    <div className="space-y-6">
      <EnhancedEventsContainer onAddEvent={onAddEvent} />
      <EventEditDrawer 
        event={editingEvent}
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
      <GiftSetupWizard
        open={isGiftWizardOpen}
        onOpenChange={handleGiftWizardClose}
        initialData={editingEventData}
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
