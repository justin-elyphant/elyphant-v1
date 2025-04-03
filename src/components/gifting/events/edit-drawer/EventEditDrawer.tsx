
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
      onSave(event.id, {
        type,
        person,
        date,
        autoGiftEnabled,
        autoGiftAmount: autoGiftEnabled ? autoGiftAmount : undefined,
        giftSource: autoGiftEnabled ? giftSource : undefined,
        privacyLevel,
      });
      onOpenChange(false);
    }
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
          />
          
          <Separator />
          
          <AutoGiftSection 
            autoGiftEnabled={autoGiftEnabled}
            autoGiftAmount={autoGiftAmount}
            giftSource={giftSource}
            setAutoGiftEnabled={setAutoGiftEnabled}
            setAutoGiftAmount={setAutoGiftAmount}
            setGiftSource={setGiftSource}
          />
          
          <Separator />
          
          <PrivacySection 
            privacyLevel={privacyLevel}
            setPrivacyLevel={setPrivacyLevel}
          />
        </div>
        
        <DrawerFooter className="pt-2">
          <Button onClick={handleSave}>Save Changes</Button>
          <DrawerClose asChild>
            <Button variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default EventEditDrawer;
