
import React from "react";
import { EventsProvider } from "./events/context/EventsContext";
import EnhancedEventsContainer from "./events/views/EnhancedEventsContainer";
import UnifiedGiftSchedulingModal from "./unified/UnifiedGiftSchedulingModal";
import { useEvents } from "./events/context/EventsContext";
import { ExtendedEventData } from "./events/types";

interface UpcomingEventsProps {
  onAddEvent: () => void;
  events?: ExtendedEventData[]; // Optional filtered events to display
}

const UpcomingEventsContent = ({ onAddEvent, events: filteredEvents }: UpcomingEventsProps) => {
  const { 
    events: allEvents,
    isAutoGiftSetupOpen,
    setIsAutoGiftSetupOpen,
    autoGiftSetupInitialData,
    setAutoGiftSetupInitialData,
    refreshEvents
  } = useEvents();

  // Refresh events when auto-gift setup dialog closes
  React.useEffect(() => {
    if (!isAutoGiftSetupOpen) {
      refreshEvents();
    }
  }, [isAutoGiftSetupOpen, refreshEvents]);

  // Use provided events or fall back to all events, then show only those without auto-gifting
  const eventsToDisplay = (filteredEvents || allEvents).filter(e => !e.autoGiftEnabled);

  const handleAutoGiftSetupClose = () => {
    setIsAutoGiftSetupOpen(false);
    setAutoGiftSetupInitialData(null);
  };

  const handleAutoGiftSetupComplete = async () => {
    // Refresh events after setup completion
    await refreshEvents();
    handleAutoGiftSetupClose();
  };

  return (
    <div className="space-y-6">
      <EnhancedEventsContainer 
        onAddEvent={onAddEvent} 
        events={eventsToDisplay}
      />
      <UnifiedGiftSchedulingModal
        open={isAutoGiftSetupOpen}
        onOpenChange={handleAutoGiftSetupClose}
        standaloneMode={true}
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
