
import { toast } from "sonner";
import { useEvents } from "../context/EventsContext";

export const useAutoGiftToggle = () => {
  const { events, setEvents } = useEvents();

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

  return {
    handleToggleAutoGift
  };
};
