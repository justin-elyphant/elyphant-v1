
import { toast } from "sonner";
import { useEvents } from "../context/EventsContext";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { useAuth } from "@/contexts/auth";

export const useAutoGiftToggle = () => {
  const { events, setEvents, openAutoGiftSetupForEvent } = useEvents();
  const { user } = useAuth();

  const handleToggleAutoGift = async (id: string) => {
    console.log(`🔐 Secure auto-gift toggle for event ${id}`);
    
    const event = events.find(e => e.id === id);
    if (!event) return;
    
    const newStatus = !event.autoGiftEnabled;
    
    // Phase 5.2: Enhanced with token-based security - Always open secure setup flow
    if (newStatus || !event.autoGiftAmount) {
      try {
        // Generate secure setup token before opening setup flow
        if (user?.id) {
          const setupToken = await unifiedGiftManagementService.generateSetupToken(user.id);
          console.log('🔐 Generated setup token for secure auto-gift setup');
          
          // Log setup initiation event
          await unifiedGiftManagementService.logAutoGiftEvent(
            user.id,
            'auto_gift_setup_initiated',
            { 
              eventId: id,
              eventType: event.type,
              recipientName: event.person
            },
            { 
              setupToken,
              source: 'event_toggle' 
            }
          );
        }
        
        openAutoGiftSetupForEvent(event);
        return;
      } catch (error) {
        console.error('❌ Error initiating secure auto-gift setup:', error);
        toast.error('Failed to initiate auto-gift setup. Please try again.');
        return;
      }
    }
    
    // Optimistic update with enhanced validation
    const updatedEvents = events.map(e => 
      e.id === id 
        ? { 
            ...e, 
            autoGiftEnabled: newStatus,
            // Enhanced defaults with validation
            autoGiftAmount: newStatus && !e.autoGiftAmount ? 50 : e.autoGiftAmount,
            giftSource: newStatus && !e.giftSource ? "wishlist" : e.giftSource
          } 
        : e
    );
    
    // Update the state optimistically
    setEvents(updatedEvents);
    
    toast.success(`Auto-gift ${newStatus ? 'enabled' : 'disabled'} for ${event.person}'s ${event.type}`);
    
    // Phase 3.3: Integrate with existing protection systems
    if (user?.id && newStatus) {
      try {
        await unifiedGiftManagementService.logAutoGiftEvent(
          user.id,
          'auto_gift_rule_updated',
          { 
            eventId: id,
            eventType: event.type,
            newStatus 
          },
          { 
            source: 'event_toggle',
            timestamp: new Date().toISOString()
          }
        );
      } catch (error) {
        console.error('❌ Error logging auto-gift event:', error);
      }
    }
  };

  return {
    handleToggleAutoGift
  };
};
