
import { useEvents } from "../context/EventsContext";

export const useEventEdit = () => {
  const { 
    events, 
    setCurrentEvent, 
    setIsEditDrawerOpen 
  } = useEvents();

  const handleEditEvent = (id: string) => {
    const eventToEdit = events.find(event => event.id === id);
    if (eventToEdit) {
      // Set the current event for editing
      setCurrentEvent(eventToEdit);
      // Open the edit drawer
      setIsEditDrawerOpen(true);
    }
  };

  return {
    handleEditEvent
  };
};
