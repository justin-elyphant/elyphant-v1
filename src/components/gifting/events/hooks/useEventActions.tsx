
import { toast } from "sonner";
import { ExtendedEventData } from "../types";
import { useEvents } from "../context/EventsContext";
import { useNavigate } from "react-router-dom";
import { formatRecipientNameForUrl, clearPersonalizedData } from "@/utils/personalizedMarketplaceUtils";

export const useEventActions = () => {
  const { events } = useEvents();
  const navigate = useNavigate();

  const handleSendGift = (id: string) => {
    console.log(`Browse gifts for event ${id}`);
    // Find the event to make sure it exists before navigating
    const event = events.find(e => e.id === id);
    if (event) {
      // Clear any existing personalized data first
      clearPersonalizedData();
      
      // Navigate to personalized marketplace page
      const recipientName = formatRecipientNameForUrl(event.person);
      navigate(`/marketplace/for/${recipientName}`, { 
        state: { 
          eventContext: {
            recipientName: event.person,
            eventType: event.type,
            eventId: id,
            relationship: 'friend', // Default, could be enhanced later
            isPersonalized: true
          }
        }
      });
      toast.success(`Opening personalized gift marketplace for ${event.person}`, {
        description: "Nicole AI is curating personalized recommendations..."
      });
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
