
import { toast } from "sonner";
import { ExtendedEventData } from "../types";
import { useEvents } from "../context/EventsContext";

export const useEventHandlers = () => {
  const { 
    events, 
    setEvents, 
    setCurrentEvent, 
    setIsEditDrawerOpen 
  } = useEvents();

  const handleSendGift = (id: number) => {
    console.log(`Send gift for event ${id}`);
    // Find the event to make sure it exists before showing the toast
    const event = events.find(e => e.id === id);
    if (event) {
      toast.success(`Gift selection opened for ${event.person}'s ${event.type}`);
    }
  };

  const handleToggleAutoGift = (id: number) => {
    console.log(`Toggle auto-gift for event ${id}`);
    
    // Create a new copy of the events array with the updated autoGiftEnabled value
    const updatedEvents = events.map(event => 
      event.id === id 
        ? { 
            ...event, 
            autoGiftEnabled: !event.autoGiftEnabled,
            // If enabling auto-gift and no amount is set, set a default
            autoGiftAmount: !event.autoGiftEnabled && !event.autoGiftAmount ? 50 : event.autoGiftAmount,
            // If enabling auto-gift and no source is set, default to wishlist
            giftSource: !event.autoGiftEnabled && !event.giftSource ? "wishlist" : event.giftSource
          } 
        : event
    );
    
    // Update the state with the new array
    setEvents(updatedEvents);
    
    const event = events.find(e => e.id === id);
    if (event) {
      toast.success(`Auto-gift ${event.autoGiftEnabled ? 'disabled' : 'enabled'} for ${event.person}'s ${event.type}`);
    }
  };
  
  const handleVerifyEvent = (id: number) => {
    console.log(`Verify event ${id}`);
    // Create a new copy of the events array with the updated verification status
    const updatedEvents = events.map(event => 
      event.id === id 
        ? { ...event, isVerified: true, needsVerification: false } 
        : event
    );
    
    // Update the state with the new array
    setEvents(updatedEvents);
    toast.success("Event verified successfully");
  };

  const handleEditEvent = (id: number) => {
    const eventToEdit = events.find(event => event.id === id);
    if (eventToEdit) {
      // Set the current event for editing
      setCurrentEvent(eventToEdit);
      // Open the edit drawer
      setIsEditDrawerOpen(true);
    }
  };

  const handleSaveEvent = (eventId: number, updatedEvent: Partial<ExtendedEventData>) => {
    console.log("Saving event with updates:", updatedEvent);
    
    const updatedEvents = events.map(event => 
      event.id === eventId 
        ? { ...event, ...updatedEvent } 
        : event
    );
    
    // Update the state with the new array
    setEvents(updatedEvents);
    toast.success("Event updated successfully");
  };

  const handleEventClick = (event: ExtendedEventData) => {
    console.log("Event clicked:", event);
    setCurrentEvent(event);
    setIsEditDrawerOpen(true);
  };

  return {
    handleSendGift,
    handleToggleAutoGift,
    handleVerifyEvent,
    handleEditEvent,
    handleSaveEvent,
    handleEventClick
  };
};
