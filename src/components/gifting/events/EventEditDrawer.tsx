
import React, { useState, useEffect } from "react";
import { Shield, Calendar, User, X, Tag, DollarSign } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ExtendedEventData } from "../UpcomingEvents";

interface EventEditDrawerProps {
  event: ExtendedEventData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (eventId: number, updatedEvent: Partial<ExtendedEventData>) => void;
}

const EventEditDrawer = ({ event, open, onOpenChange, onSave }: EventEditDrawerProps) => {
  // Define privacy level type explicitly
  type PrivacyLevel = "private" | "shared" | "public";

  // State for form fields
  const [type, setType] = useState("");
  const [person, setPerson] = useState("");
  const [date, setDate] = useState("");
  const [autoGiftEnabled, setAutoGiftEnabled] = useState(false);
  const [autoGiftAmount, setAutoGiftAmount] = useState(0);
  const [giftSource, setGiftSource] = useState<"wishlist" | "ai" | "both">("wishlist");
  // Fix: Explicitly type privacyLevel as PrivacyLevel
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>("private");

  // Initialize form when event changes
  useEffect(() => {
    if (event) {
      setType(event.type);
      setPerson(event.person);
      setDate(event.date);
      setAutoGiftEnabled(event.autoGiftEnabled);
      setAutoGiftAmount(event.autoGiftAmount || 0);
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="occasion-type">
                <Tag className="h-4 w-4 mr-2 inline-block" />
                Occasion Type
              </Label>
              <Input
                id="occasion-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Birthday, Anniversary, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="person">
                <User className="h-4 w-4 mr-2 inline-block" />
                Person
              </Label>
              <Input
                id="person"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="Name of the person"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">
                <Calendar className="h-4 w-4 mr-2 inline-block" />
                Date
              </Label>
              <Input
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="MM/DD/YYYY"
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-md font-medium">Auto-Gifting Settings</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-gift">Enable Auto-Gifting</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send a gift for this occasion
                </p>
              </div>
              <Switch
                id="auto-gift"
                checked={autoGiftEnabled}
                onCheckedChange={setAutoGiftEnabled}
              />
            </div>
            
            {autoGiftEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="gift-amount">
                    <DollarSign className="h-4 w-4 mr-2 inline-block" />
                    Gift Amount
                  </Label>
                  <Input
                    id="gift-amount"
                    type="number"
                    value={autoGiftAmount}
                    onChange={(e) => setAutoGiftAmount(Number(e.target.value))}
                    placeholder="Gift budget in dollars"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Gift Selection Source</Label>
                  <RadioGroup 
                    value={giftSource} 
                    onValueChange={(value: "wishlist" | "ai" | "both") => setGiftSource(value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="wishlist" id="wishlist" />
                      <Label htmlFor="wishlist">From wishlist</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ai" id="ai" />
                      <Label htmlFor="ai">AI selected</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both">Wishlist + AI</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Privacy Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Control who can see this event
              </p>
            </div>
            
            <RadioGroup 
              value={privacyLevel}
              onValueChange={(value: PrivacyLevel) => setPrivacyLevel(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private">Private (Only visible to you)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shared" id="shared" />
                <Label htmlFor="shared">Shared (Visible to connected users)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public">Public (Visible to everyone)</Label>
              </div>
            </RadioGroup>
          </div>
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
