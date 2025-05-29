
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AddEventForm from "./AddEventForm";
import { EventFormData } from "./types";
import { useEventHandlers } from "../hooks/useEventHandlers";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddEventDialog = ({ open, onOpenChange }: AddEventDialogProps) => {
  const [formData, setFormData] = useState<EventFormData>({
    eventType: "",
    personName: "",
    date: null,
    privacyLevel: "private",
    autoGiftEnabled: false,
    giftBudget: 50,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { handleCreateEvent } = useEventHandlers();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.eventType.trim()) {
      errors.eventType = "Event type is required";
    }
    
    if (!formData.personName.trim()) {
      errors.personName = "Person name is required";
    }
    
    if (!formData.date) {
      errors.date = "Date is required";
    } else if (formData.date < new Date()) {
      errors.date = "Date must be in the future";
    }
    
    if (formData.autoGiftEnabled && formData.giftBudget <= 0) {
      errors.giftBudget = "Gift budget must be greater than 0";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      setIsSaving(true);
      setValidationErrors({});
      
      await handleCreateEvent({
        type: formData.eventType.trim(),
        person: formData.personName.trim(),
        dateObj: formData.date,
        privacyLevel: formData.privacyLevel,
        autoGiftEnabled: formData.autoGiftEnabled,
        autoGiftAmount: formData.autoGiftEnabled ? formData.giftBudget : undefined,
        giftSource: formData.autoGiftEnabled ? "wishlist" : undefined
      });

      // Reset form and close dialog on success
      setFormData({
        eventType: "",
        personName: "",
        date: null,
        privacyLevel: "private",
        autoGiftEnabled: false,
        giftBudget: 50,
      });
      onOpenChange(false);
      toast.success(`Event created for ${formData.personName}'s ${formData.eventType}`);
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValidationErrors({});
    onOpenChange(false);
  };

  const isFormValid = formData.eventType.trim() && formData.personName.trim() && formData.date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Add a special date to keep track of important occasions.
          </DialogDescription>
        </DialogHeader>

        <AddEventForm 
          formData={formData} 
          onFormDataChange={setFormData}
          validationErrors={validationErrors}
        />

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Event"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;
