
import { useEvents } from "../context/EventsContext";
import { GiftSetupData } from "@/components/gifting/GiftSetupWizard";

export const useEventEdit = () => {
  const { 
    events, 
    setCurrentEvent, 
    setIsGiftWizardOpen,
    setGiftWizardInitialData 
  } = useEvents();

  const transformEventToGiftSetupData = (event: any): any => {
    console.log('Transforming event for edit:', event); // Debug log
    
    // Extract date string properly
    let dateString = '';
    if (event.dateObj) {
      dateString = event.dateObj.toISOString().split('T')[0];
    } else if (event.date) {
      // If date is already a string, try to parse it
      const parsedDate = new Date(event.date);
      dateString = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString().split('T')[0] : '';
    }

    const giftSetupData = {
      // Recipient information
      recipientName: event.person || "",
      recipientEmail: event.recipientEmail || "",
      relationshipType: event.relationshipType || "friend",
      
      // Event details
      giftingEvents: [{
        dateType: event.type || "birthday",
        date: dateString,
        isRecurring: event.isRecurring || false,
        customName: event.type || "birthday"
      }],
      
      // Auto-gifting settings
      autoGiftingEnabled: event.autoGiftEnabled || false,
      scheduledGiftingEnabled: !(event.autoGiftEnabled || false),
      budgetLimit: event.autoGiftAmount || 50,
      
      // Gift preferences
      giftCategories: event.giftCategories || [],
      
      // Notification settings  
      notificationDays: event.notificationDays || [7, 3, 1],
      
      // Connection details if available
      connectionId: event.connectionId,
      connectionStatus: event.connectionStatus,
      
      // Shipping address if available (for pending invitations that became events)
      shippingAddress: event.shippingAddress || null
    };

    console.log('Transformed gift setup data:', giftSetupData); // Debug log
    return giftSetupData;
  };

  const handleEditEvent = (id: string) => {
    const eventToEdit = events.find(event => event.id === id);
    if (eventToEdit) {
      console.log('🔍 Editing event - Full event data:', eventToEdit); // Debug log
      console.log('🔍 Recipient Email:', eventToEdit.recipientEmail); // Debug log
      console.log('🔍 Relationship Type:', eventToEdit.relationshipType); // Debug log
      
      // Transform event to gift setup data
      const giftSetupData = transformEventToGiftSetupData(eventToEdit);
      console.log('🔍 Transformed data for wizard:', giftSetupData); // Debug log
      
      // Set the initial data for the gift wizard
      setGiftWizardInitialData(giftSetupData);
      
      // Open the gift wizard
      setIsGiftWizardOpen(true);
    } else {
      console.log('🚫 Event not found with id:', id);
    }
  };

  return {
    handleEditEvent
  };
};
