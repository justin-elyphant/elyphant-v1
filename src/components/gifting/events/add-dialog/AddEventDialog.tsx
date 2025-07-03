
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AddEventForm } from "./AddEventForm";
import { EventFormData } from "./types";
import { eventsService, transformExtendedEventToDatabase } from "@/services/eventsService";
import { useEvents } from "../context/EventsContext";

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddEventDialog = ({ open, onOpenChange }: AddEventDialogProps) => {
  const { refreshEvents } = useEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      // Create the extended event data structure
      const extendedEventData = {
        id: "", // Will be set by the service
        type: data.eventType,
        person: data.personName,
        date: data.date!.toLocaleDateString(),
        daysAway: 0,
        autoGiftEnabled: data.autoGiftEnabled,
        autoGiftAmount: data.giftBudget,
        privacyLevel: data.privacyLevel,
        isVerified: true,
        needsVerification: false,
        giftSource: "wishlist" as const,
        dateObj: data.date!,
        isRecurring: data.isRecurring,
        recurringType: data.recurringType,
      };

      // Transform to database format
      const dbEventData = {
        ...transformExtendedEventToDatabase(extendedEventData),
        is_recurring: data.isRecurring,
        recurring_type: data.recurringType,
      };

      await eventsService.createEvent(dbEventData);
      await refreshEvents();
      
      toast.success(`${data.eventType} for ${data.personName} has been added!`);
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        
        <AddEventForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;
