
import React from "react";
import { EventsProvider } from "./events/context/EventsContext";
import EnhancedEventsContainer from "./events/views/EnhancedEventsContainer";
import { GiftSetupWizard } from "./GiftSetupWizard";
import { useEvents } from "./events/context/EventsContext";

interface UpcomingEventsProps {
  onAddEvent: () => void;
}

const UpcomingEventsContent = ({ onAddEvent }: UpcomingEventsProps) => {
  const { 
    isGiftWizardOpen,
    setIsGiftWizardOpen,
    giftWizardInitialData,
    setGiftWizardInitialData,
    refreshEvents
  } = useEvents();

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
      <EnhancedEventsContainer onAddEvent={onAddEvent} />
      <GiftSetupWizard
        open={isGiftWizardOpen}
        onOpenChange={handleGiftWizardClose}
        initialData={giftWizardInitialData}
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
