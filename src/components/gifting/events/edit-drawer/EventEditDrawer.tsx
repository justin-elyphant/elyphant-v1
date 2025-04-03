
import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import EventFormSection from "./EventFormSection";
import AutoGiftSection from "./AutoGiftSection";
import PrivacySection from "./PrivacySection";
import { EditDrawerProps, PrivacyLevel, GiftSource } from "./types";

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

  // Initialize form when event changes
  useEffect(() => {
    if (event) {
      setType(event.type);
      setPerson(event.person);
      setDate(event.date);
      setAutoGiftEnabled(event.autoGiftEnabled || false);
      // Make sure autoGiftAmount is initialized properly
      setAutoGiftAmount(event.autoGiftAmount || 50); // Default to 50 if not set
      setGiftSource(event.giftSource || "wishlist");
      // Make sure we cast the string to the correct type
      setPrivacyLevel((event.privacyLevel || "private") as PrivacyLevel);
    }
  }, [event]);

  const handleSave = () => {
    if (event) {
      setIsSaving(true);
      onSave(event.id, {
        type,
        person,
        date,
        autoGiftEnabled,
        autoGiftAmount: autoGiftEnabled ? autoGiftAmount : undefined,
        giftSource: autoGiftEnabled ? giftSource : undefined,
        privacyLevel,
      });
      toast.success("Gift occasion updated successfully");
      onOpenChange(false);
      setIsSaving(false);
    }
  };

  if (!event) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh] overflow-y-auto max-w-md mx-auto rounded-t-xl">
        <DrawerHeader className="text-left bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-t-xl pb-1 pt-2">
          <DrawerTitle className="text-primary text-sm">Edit Gift Occasion</DrawerTitle>
          <DrawerDescription className="text-muted-foreground text-xs">
            Update details for {person}'s {type}
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-3 py-0 space-y-0">
          <EventFormSection 
            type={type}
            person={person}
            date={date}
            setType={setType}
            setPerson={setPerson}
            setDate={setDate}
          />
          
          <Separator className="bg-purple-100 dark:bg-purple-900/20 my-0.5" />
          
          <AutoGiftSection 
            autoGiftEnabled={autoGiftEnabled}
            autoGiftAmount={autoGiftAmount}
            giftSource={giftSource}
            setAutoGiftEnabled={setAutoGiftEnabled}
            setAutoGiftAmount={setAutoGiftAmount}
            setGiftSource={setGiftSource}
          />
          
          <Separator className="bg-purple-100 dark:bg-purple-900/20 my-0.5" />
          
          <PrivacySection 
            privacyLevel={privacyLevel}
            setPrivacyLevel={setPrivacyLevel}
          />
        </div>
        
        <DrawerFooter className="pt-1 pb-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between w-full gap-2">
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-primary hover:bg-primary/90 h-6 text-xs py-0"
              disabled={isSaving}
            >
              <Save className="h-3 w-3 mr-1" />
              Save Changes
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="border-primary/20 hover:bg-primary/10 h-6 text-xs py-0">
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default EventEditDrawer;
