
import { toast } from "sonner";
import { ExtendedEventData } from "../types";
import { useEvents } from "../context/EventsContext";
import { eventsService, transformExtendedEventToDatabase } from "@/services/eventsService";

export const useEventCRUD = () => {
  const { 
    events, 
    setEvents, 
    refreshEvents 
  } = useEvents();

  const handleSaveEvent = async (eventId: string, updatedEvent: Partial<ExtendedEventData>) => {
    console.log("Saving event with updates:", updatedEvent);
    
    try {
      // Find the original event
      const originalEvent = events.find(event => event.id === eventId);
      if (!originalEvent) {
        toast.error("Event not found");
        return;
      }

      // Optimistic update - immediately update the UI
      const optimisticUpdatedEvents = events.map(event => 
        event.id === eventId 
          ? { ...event, ...updatedEvent }
          : event
      );
      setEvents(optimisticUpdatedEvents);

      // Merge the updates with the original event
      const mergedEvent = { ...originalEvent, ...updatedEvent };
      
      // Convert to database format and save
      const dbEventData = transformExtendedEventToDatabase(mergedEvent);
      await eventsService.updateEvent({
        id: originalEvent.id,
        ...dbEventData
      });

      // Refresh events from database to ensure consistency
      await refreshEvents();
      
      // Success is handled in the component
    } catch (error) {
      console.error("Error saving event:", error);
      
      // Revert optimistic update on error
      await refreshEvents();
      
      throw error; // Re-throw to let the component handle the error message
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) {
        toast.error("Event not found");
        return;
      }

      // Optimistic update - immediately remove from UI
      const optimisticUpdatedEvents = events.filter(e => e.id !== eventId);
      setEvents(optimisticUpdatedEvents);

      await eventsService.deleteEvent(eventId);
      
      // Refresh events from database to ensure consistency
      await refreshEvents();
      
      toast.success(`Deleted ${event.person}'s ${event.type}`);
    } catch (error) {
      console.error("Error deleting event:", error);
      
      // Revert optimistic update on error
      await refreshEvents();
      
      throw error; // Re-throw to let the component handle the error message
    }
  };

  const handleCreateEvent = async (eventData: Partial<ExtendedEventData>) => {
    try {
      if (!eventData.type || !eventData.person || !eventData.dateObj) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Create optimistic event for immediate UI feedback
      const optimisticEvent: ExtendedEventData = {
        id: `temp-${Date.now()}`, // Temporary ID
        type: eventData.type,
        person: eventData.person,
        date: eventData.dateObj.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        daysAway: Math.max(0, Math.ceil((eventData.dateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
        avatarUrl: "/placeholder.svg",
        autoGiftEnabled: eventData.autoGiftEnabled || false,
        autoGiftAmount: eventData.autoGiftAmount || 0,
        privacyLevel: eventData.privacyLevel || "private",
        isVerified: true,
        needsVerification: false,
        giftSource: eventData.giftSource || "wishlist",
        dateObj: eventData.dateObj
      };

      // Optimistic update - immediately add to UI
      setEvents([...events, optimisticEvent]);

      const dbEventData = transformExtendedEventToDatabase(eventData as ExtendedEventData);
      await eventsService.createEvent(dbEventData);
      
      // Refresh events from database to get the real ID and ensure consistency
      await refreshEvents();
      
      // Success is handled in the component
    } catch (error) {
      console.error("Error creating event:", error);
      
      // Revert optimistic update on error
      await refreshEvents();
      
      throw error; // Re-throw to let the component handle the error message
    }
  };

  return {
    handleSaveEvent,
    handleDeleteEvent,
    handleCreateEvent
  };
};
