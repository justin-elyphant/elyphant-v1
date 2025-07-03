
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const [formData, setFormData] = useState<EventFormData>({
    eventType: "",
    personName: "",
    date: null,
    privacyLevel: "private",
    autoGiftEnabled: false,
    giftBudget: 50,
    isRecurring: false,
    recurringType: "yearly",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.eventType) {
      errors.eventType = "Please select an event type";
    }

    if (!formData.personName?.trim()) {
      errors.personName = "Please enter a person's name";
    }

    if (!formData.date) {
      errors.date = "Please select a date";
    }

    if (formData.isRecurring && !formData.recurringType) {
      errors.recurringType = "Please select a recurring frequency";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the extended event data structure
      const extendedEventData = {
        id: "", // Will be set by the service
        type: formData.eventType,
        person: formData.personName,
        date: formData.date!.toLocaleDateString(),
        daysAway: 0,
        autoGiftEnabled: formData.autoGiftEnabled,
        autoGiftAmount: formData.giftBudget,
        privacyLevel: formData.privacyLevel,
        isVerified: true,
        needsVerification: false,
        giftSource: "wishlist" as const,
        dateObj: formData.date!,
        isRecurring: formData.isRecurring,
        recurringType: formData.recurringType,
      };

      // Transform to database format
      const dbEventData = {
        ...transformExtendedEventToDatabase(extendedEventData),
        is_recurring: formData.isRecurring,
        recurring_type: formData.recurringType,
      };

      await eventsService.createEvent(dbEventData);
      await refreshEvents();
      
      toast.success(`${formData.eventType} for ${formData.personName} has been added!`);
      
      // Reset form
      setFormData({
        eventType: "",
        personName: "",
        date: null,
        privacyLevel: "private",
        autoGiftEnabled: false,
        giftBudget: 50,
        isRecurring: false,
        recurringType: "yearly",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        
        <AddEventForm 
          formData={formData}
          onFormDataChange={setFormData}
          validationErrors={validationErrors}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;
