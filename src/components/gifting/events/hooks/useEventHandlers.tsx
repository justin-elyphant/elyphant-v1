
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
    
    // Optimistic update
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
    
    // Update the state optimistically
    setEvents(updatedEvents);
    
    const event = events.find(e => e.id === id);
    if (event) {
      const newStatus = !event.autoGiftEnabled;
      toast.success(`Auto-gift ${newStatus ? 'enabled' : 'disabled'} for ${event.person}'s ${event.type}`);
      
      // TODO: Save auto-gift settings to auto_gifting_rules table in Phase 4
      // For now, just update the UI optimistically
    }
  };
  
  const handleVerifyEvent = async (id: string) => {
    console.log(`Verify event ${id}`);
    
    // Optimistic update
    const updatedEvents = events.map(event => 
      event.id === id 
        ? { ...event, isVerified: true, needsVerification: false } 
        : event
    );
    
    // Update the state optimistically
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
      setEvents(prevEvents => [...prevEvents, optimisticEvent]);

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
