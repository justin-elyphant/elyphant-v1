
import { useEvents } from "../context/EventsContext";
import { GiftSetupData } from "@/components/gifting/GiftSetupWizard";

export const useEventEdit = () => {
  const { 
    events, 
    setCurrentEvent, 
    setIsGiftWizardOpen,
    setEditingEventData 
  } = useEvents();

  const transformEventToGiftSetupData = (event: any): Partial<GiftSetupData> => {
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

    const giftSetupData: Partial<GiftSetupData> = {
      recipientName: event.person || "",
      recipientEmail: event.recipientEmail || "",
      relationshipType: event.relationshipType || "friend",
      giftingEvents: [{
        dateType: event.type || "birthday",
        date: dateString,
        isRecurring: event.isRecurring || false,
        customName: event.type || "birthday"
      }],
      autoGiftingEnabled: event.autoGiftEnabled || false,
      scheduledGiftingEnabled: !(event.autoGiftEnabled || false),
      budgetLimit: event.autoGiftAmount || 50,
      giftCategories: event.giftCategories || [],
      notificationDays: event.notificationDays || [7, 3, 1]
    };

    console.log('Transformed gift setup data:', giftSetupData); // Debug log
    return giftSetupData;
  };

  const handleEditEvent = (id: string) => {
    const eventToEdit = events.find(event => event.id === id);
    if (eventToEdit) {
      // Transform event to gift setup data
      const giftSetupData = transformEventToGiftSetupData(eventToEdit);
      
      // Set the editing data
      setEditingEventData(giftSetupData);
      
      // Open the gift wizard
      setIsGiftWizardOpen(true);
    }
  };

  return {
    handleEditEvent
  };
};
