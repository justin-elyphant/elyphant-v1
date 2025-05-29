
import { toast } from "sonner";
import { ExtendedEventData } from "../types";
import { useEvents } from "../context/EventsContext";
import { eventsService, transformExtendedEventToDatabase } from "@/services/eventsService";

export const useEventHandlers = () => {
  const { 
    events, 
    setEvents, 
    setCurrentEvent, 
    setIsEditDrawerOpen,
    refreshEvents 
  } = useEvents();

  const handleSendGift = (id: string) => {
    console.log(`Send gift for event ${id}`);
    // Find the event to make sure it exists before showing the toast
    const event = events.find(e => e.id === id);
    if (event) {
      toast.success(`Gift selection opened for ${event.person}'s ${event.type}`);
    }
  };

  const handleToggleAutoGift = async (id: string) => {
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

    // TODO: Save auto-gift settings to auto_gifting_rules table in Phase 4
  };
  
  const handleVerifyEvent = async (id: string) => {
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

  const handleEditEvent = (id: string) => {
    const eventToEdit = events.find(event => event.id === id);
    if (eventToEdit) {
      // Set the current event for editing
      setCurrentEvent(eventToEdit);
      // Open the edit drawer
      setIsEditDrawerOpen(true);
    }
  };

  const handleSaveEvent = async (eventId: string, updatedEvent: Partial<ExtendedEventData>) => {
    console.log("Saving event with updates:", updatedEvent);
    
    try {
      // Find the original event
      const originalEvent = events.find(event => event.id === eventId);
      if (!originalEvent) {
        toast.error("Event not found");
        return;
      }

      // Merge the updates with the original event
      const mergedEvent = { ...originalEvent, ...updatedEvent };
      
      // Convert to database format and save
      const dbEventData = transformExtendedEventToDatabase(mergedEvent);
      await eventsService.updateEvent({
        id: originalEvent.id, // Keep as UUID string
        ...dbEventData
      });

      // Refresh events from database to get the latest data
      await refreshEvents();
      
      toast.success("Event updated successfully");
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event changes");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) {
        toast.error("Event not found");
        return;
      }

      await eventsService.deleteEvent(eventId); // Use string ID directly
      
      // Refresh events from database
      await refreshEvents();
      
      toast.success(`Deleted ${event.person}'s ${event.type}`);
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const handleCreateEvent = async (eventData: Partial<ExtendedEventData>) => {
    try {
      if (!eventData.type || !eventData.person || !eventData.dateObj) {
        toast.error("Please fill in all required fields");
        return;
      }

      const dbEventData = transformExtendedEventToDatabase(eventData as ExtendedEventData);
      await eventsService.createEvent(dbEventData);
      
      // Refresh events from database
      await refreshEvents();
      
      toast.success(`Created ${eventData.person}'s ${eventData.type}`);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    }
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
    handleDeleteEvent,
    handleCreateEvent,
    handleEventClick
  };
};
