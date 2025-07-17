import { useState } from "react";
import { eventCRUD } from "@/services/events/eventCRUD";
import { useEvents } from "../context/EventsContext";
import { useToast } from "@/hooks/use-toast";

export const useEventArchive = () => {
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [eventToArchive, setEventToArchive] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);
  
  const { refreshEvents } = useEvents();
  const { toast } = useToast();

  const handleArchiveEvent = (eventId: string, eventName: string, eventType: string) => {
    setEventToArchive({ id: eventId, name: eventName, type: eventType });
    setArchiveDialogOpen(true);
  };

  const confirmArchive = async () => {
    if (!eventToArchive) return;

    try {
      await eventCRUD.archiveEvent(eventToArchive.id);
      await refreshEvents();
      
      toast(`${eventToArchive.name}'s ${eventToArchive.type} has been archived.`);
    } catch (error) {
      console.error('Error archiving event:', error);
      toast("Failed to archive event. Please try again.");
    } finally {
      setArchiveDialogOpen(false);
      setEventToArchive(null);
    }
  };

  const handleUnarchiveEvent = async (eventId: string) => {
    try {
      await eventCRUD.unarchiveEvent(eventId);
      await refreshEvents();
      
      toast("Event has been restored to your upcoming events.");
    } catch (error) {
      console.error('Error unarchiving event:', error);
      toast("Failed to restore event. Please try again.");
    }
  };

  return {
    archiveDialogOpen,
    setArchiveDialogOpen,
    eventToArchive,
    handleArchiveEvent,
    confirmArchive,
    handleUnarchiveEvent,
  };
};