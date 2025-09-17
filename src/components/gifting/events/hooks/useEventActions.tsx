
import { toast } from "sonner";
import { ExtendedEventData } from "../types";
import { useEvents } from "../context/EventsContext";
import { useNavigate } from "react-router-dom";

export const useEventActions = () => {
  const { events } = useEvents();
  const navigate = useNavigate();

  const handleSendGift = (id: string) => {
    console.log(`Browse gifts for event ${id}`);
    // Find the event to make sure it exists before navigating
    const event = events.find(e => e.id === id);
    if (event) {
      // Navigate to marketplace with optional context
      navigate('/marketplace', { 
        state: { 
          eventContext: {
            recipientName: event.person,
            eventType: event.type,
            eventId: id
          }
        }
      });
      toast.success(`Opening gift marketplace for ${event.person}'s ${event.type}`);
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
    const { setCurrentEvent } = useEvents();
    setCurrentEvent(event);
    // For now, just set the current event - detailed view can be added later
  };

  return {
    handleSendGift,
    handleVerifyEvent,
    handleEventClick
  };
};
