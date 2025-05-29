
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
  
  const { handleCreateEvent } = useEventHandlers();

  const handleSave = async () => {
    if (!formData.eventType || !formData.personName || !formData.date) {
      return;
    }

    try {
      setIsSaving(true);
      
      await handleCreateEvent({
        type: formData.eventType,
        person: formData.personName,
        dateObj: formData.date,
        privacyLevel: formData.privacyLevel,
        autoGiftEnabled: formData.autoGiftEnabled,
        autoGiftAmount: formData.giftBudget,
        giftSource: "wishlist"
      });

      // Reset form and close dialog
      setFormData({
        eventType: "",
        personName: "",
        date: null,
        privacyLevel: "private",
        autoGiftEnabled: false,
        giftBudget: 50,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.eventType && formData.personName && formData.date;

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
        />

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
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
                Saving...
              </>
            ) : (
              "Save Event"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;
