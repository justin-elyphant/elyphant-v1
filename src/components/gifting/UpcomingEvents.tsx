
import React from "react";
import { EventsProvider } from "./events/context/EventsContext";
import EnhancedEventsContainer from "./events/views/EnhancedEventsContainer";
import AutoGiftSetupFlow from "./auto-gift/AutoGiftSetupFlow";
import { useEvents } from "./events/context/EventsContext";
import { ExtendedEventData } from "./events/types";

interface UpcomingEventsProps {
  onAddEvent: () => void;
  events?: ExtendedEventData[]; // Optional filtered events to display
}

const UpcomingEventsContent = ({ onAddEvent, events: filteredEvents }: UpcomingEventsProps) => {
  const { 
    events: allEvents,
    isGiftWizardOpen,
    setIsGiftWizardOpen,
    giftWizardInitialData,
    setGiftWizardInitialData,
    refreshEvents
  } = useEvents();

  // Use provided events or fall back to all events
  const eventsToDisplay = filteredEvents || allEvents;

  const handleGiftWizardClose = () => {
    setIsGiftWizardOpen(false);
    setGiftWizardInitialData(null);
  };

  const handleGiftWizardComplete = async () => {
    // Refresh events after wizard completion
    await refreshEvents();
    handleGiftWizardClose();
  };

  return (
    <div className="space-y-6">
      <EnhancedEventsContainer 
        onAddEvent={onAddEvent} 
        events={eventsToDisplay}
      />
      <AutoGiftSetupFlow
        open={isGiftWizardOpen}
        onOpenChange={handleGiftWizardClose}
      />
    </div>
  );
};

const UpcomingEvents = ({ onAddEvent, events }: UpcomingEventsProps) => {
  // If we already have events context (from parent), don't wrap again
  if (events !== undefined) {
    return <UpcomingEventsContent onAddEvent={onAddEvent} events={events} />;
  }

  return (
    <EventsProvider>
      <UpcomingEventsContent onAddEvent={onAddEvent} events={events} />
    </EventsProvider>
  );
};

export default UpcomingEvents;
