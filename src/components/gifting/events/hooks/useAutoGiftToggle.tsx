
import { toast } from "sonner";
import { useEvents } from "../context/EventsContext";

export const useAutoGiftToggle = () => {
  const { events, setEvents, openAutoGiftSetupForEvent } = useEvents();

  const handleToggleAutoGift = async (id: string) => {
    console.log(`Toggle auto-gift for event ${id}`);
    
    const event = events.find(e => e.id === id);
    if (!event) return;
    
    const newStatus = !event.autoGiftEnabled;
    
    // If enabling auto-gift and no setup exists, open the wizard
    if (newStatus && !event.autoGiftAmount) {
      openAutoGiftSetupForEvent(event);
      return;
    }
    
    // Optimistic update
    const updatedEvents = events.map(e => 
      e.id === id 
        ? { 
            ...e, 
            autoGiftEnabled: newStatus,
            // If enabling auto-gift and no amount is set, set a default
            autoGiftAmount: newStatus && !e.autoGiftAmount ? 50 : e.autoGiftAmount,
            // If enabling auto-gift and no source is set, default to wishlist
            giftSource: newStatus && !e.giftSource ? "wishlist" : e.giftSource
          } 
        : e
    );
    
    // Update the state optimistically
    setEvents(updatedEvents);
    
    toast.success(`Auto-gift ${newStatus ? 'enabled' : 'disabled'} for ${event.person}'s ${event.type}`);
    
    // TODO: Save auto-gift settings to auto_gifting_rules table in Phase 4
    // For now, just update the UI optimistically
  };

  return {
    handleToggleAutoGift
  };
};
