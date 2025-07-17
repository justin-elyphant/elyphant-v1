import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Archive } from "lucide-react";

interface ArchiveEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  eventName: string;
  eventType: string;
}

const ArchiveEventDialog: React.FC<ArchiveEventDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  eventName,
  eventType,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive Event
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive{" "}
            <span className="font-semibold">{eventName}'s {eventType}</span>?
            <br />
            <br />
            This will remove it from your upcoming events list. You can still view 
            and restore archived events from the Events page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Archive Event
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ArchiveEventDialog;