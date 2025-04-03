
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AddEventForm from "./AddEventForm";

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddEventDialog = ({ open, onOpenChange }: AddEventDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Add important dates to remember or set up auto-gifting.
          </DialogDescription>
        </DialogHeader>
        
        <AddEventForm onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;
