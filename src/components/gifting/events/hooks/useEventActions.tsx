
import { toast } from "sonner";
import { ExtendedEventData } from "../types";
import { useEvents } from "../context/EventsContext";

export const useEventActions = () => {
  const { events } = useEvents();

  const handleSendGift = (id: string) => {
    console.log(`Send gift for event ${id}`);
    // Find the event to make sure it exists before showing the toast
    const event = events.find(e => e.id === id);
    if (event) {
      toast.success(`Gift selection opened for ${event.person}'s ${event.type}`);
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
    const { setEvents } = useEvents();
    setEvents(updatedEvents);
    toast.success("Event verified successfully");
  };

  const handleEventClick = (event: ExtendedEventData) => {
    console.log("Event clicked:", event);
    const { setCurrentEvent, setIsEditDrawerOpen } = useEvents();
    setCurrentEvent(event);
    setIsEditDrawerOpen(true);
  };

  return {
    handleSendGift,
    handleVerifyEvent,
    handleEventClick
  };
};
