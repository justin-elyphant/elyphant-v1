
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Trash2, Calendar, Repeat } from "lucide-react";
import { ExtendedEventData, DeleteOptions } from "../types";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ExtendedEventData | null;
  onConfirm: (options: DeleteOptions) => void;
}

const DeleteConfirmationDialog = ({ 
  open, 
  onOpenChange, 
  event, 
  onConfirm 
}: DeleteConfirmationDialogProps) => {
  const [deleteType, setDeleteType] = React.useState<DeleteOptions['deleteType']>('this_only');

  const handleConfirm = () => {
    onConfirm({ deleteType });
    onOpenChange(false);
  };

  if (!event) return null;

  const isRecurring = event.isRecurring && event.seriesId;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Delete Event
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{event.type} - {event.person}"?
            {isRecurring && " This is part of a recurring series."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isRecurring && (
          <div className="py-4">
            <RadioGroup
              value={deleteType}
              onValueChange={(value) => setDeleteType(value as DeleteOptions['deleteType'])}
              className="flex flex-col space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="this_only" id="delete_this_only" />
                <Label htmlFor="delete_this_only" className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  This event only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all_future" id="delete_all_future" />
                <Label htmlFor="delete_all_future" className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  This and all future events
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="entire_series" id="delete_entire_series" />
                <Label htmlFor="delete_entire_series" className="flex items-center gap-2">
                  <Repeat className="h-3 w-3" />
                  Entire recurring series
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
