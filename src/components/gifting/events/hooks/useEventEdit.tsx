
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
    return {
      recipientName: event.person,
      recipientEmail: "", // TODO: Get from connection if exists
      relationshipType: "friend", // TODO: Get from connection if exists
      giftingEvents: [{
        dateType: event.type,
        date: event.date,
        isRecurring: event.isRecurring || false,
        customName: event.type
      }],
      autoGiftingEnabled: event.autoGiftEnabled || false,
      scheduledGiftingEnabled: !event.autoGiftEnabled,
      budgetLimit: event.autoGiftAmount || 50,
      giftCategories: [], // TODO: Get from existing rules
      notificationDays: [7, 3, 1], // TODO: Get from existing rules
    };
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
