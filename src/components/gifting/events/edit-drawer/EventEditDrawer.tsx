
import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import EventFormSection from "./EventFormSection";
import AutoGiftSection from "./AutoGiftSection";
import PrivacySection from "./PrivacySection";
import { EditDrawerProps, PrivacyLevel, GiftSource } from "./types";
import { useEventHandlers } from "../hooks/useEventHandlers";
import { toast } from "sonner";

const EventEditDrawer = ({ event, open, onOpenChange, onSave }: EditDrawerProps) => {
  // State for form fields
  const [type, setType] = useState("");
  const [person, setPerson] = useState("");
  const [date, setDate] = useState("");
  const [autoGiftEnabled, setAutoGiftEnabled] = useState(false);
  const [autoGiftAmount, setAutoGiftAmount] = useState(0);
  const [giftSource, setGiftSource] = useState<GiftSource>("wishlist");
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>("private");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { handleDeleteEvent } = useEventHandlers();

  // Initialize form when event changes
  useEffect(() => {
    if (event) {
      setType(event.type);
      setPerson(event.person);
      setDate(event.date);
      setAutoGiftEnabled(event.autoGiftEnabled);
      setAutoGiftAmount(event.autoGiftAmount || 0);
      setGiftSource((event.giftSource || "wishlist") as GiftSource);
      setPrivacyLevel((event.privacyLevel || "private") as PrivacyLevel);
      setValidationErrors({});
    }
  }, [event]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!type.trim()) {
      errors.type = "Event type is required";
    }
    
    if (!person.trim()) {
      errors.person = "Person name is required";
    }
    
    if (!date.trim()) {
      errors.date = "Date is required";
    }
    
    if (autoGiftEnabled && autoGiftAmount <= 0) {
      errors.autoGiftAmount = "Gift amount must be greater than 0";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!event || !validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      setIsSaving(true);
      setValidationErrors({});
      
      await onSave(event.id, {
        type: type.trim(),
        person: person.trim(),
        date: date.trim(),
        autoGiftEnabled,
        autoGiftAmount: autoGiftEnabled ? autoGiftAmount : undefined,
        giftSource: autoGiftEnabled ? giftSource : undefined,
        privacyLevel,
      });
      
      onOpenChange(false);
      toast.success(`Updated ${person}'s ${type}`);
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    try {
      setIsDeleting(true);
      await handleDeleteEvent(event.id);
      onOpenChange(false);
      // Success toast is handled in the delete handler
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setValidationErrors({});
    onOpenChange(false);
  };

  if (!event) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit Gift Occasion</DrawerTitle>
          <DrawerDescription>
            Update the details for {person}'s {type}
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4 py-2 space-y-6">
          <EventFormSection 
            type={type}
            person={person}
            date={date}
            setType={setType}
            setPerson={setPerson}
            setDate={setDate}
            validationErrors={validationErrors}
          />
          
          <Separator />
          
          <AutoGiftSection 
            autoGiftEnabled={autoGiftEnabled}
            autoGiftAmount={autoGiftAmount}
            giftSource={giftSource}
            setAutoGiftEnabled={setAutoGiftEnabled}
            setAutoGiftAmount={setAutoGiftAmount}
            setGiftSource={setGiftSource}
            validationErrors={validationErrors}
          />
          
          <Separator />
          
          <PrivacySection 
            privacyLevel={privacyLevel}
            setPrivacyLevel={setPrivacyLevel}
          />
        </div>
        
        <DrawerFooter className="pt-2">
          <div className="flex justify-between items-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting || isSaving}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {person}'s {type}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <DrawerClose asChild>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving || isDeleting}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </DrawerClose>
              <Button onClick={handleSave} disabled={isSaving || isDeleting}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default EventEditDrawer;
