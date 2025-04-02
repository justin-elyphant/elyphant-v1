
import React, { useState } from "react";
import { Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import EventHeader from "./events/EventHeader";
import EventCard, { EventData } from "./events/EventCard";
import EventEditDrawer from "./events/EventEditDrawer";
import { toast } from "sonner";

export interface ExtendedEventData extends EventData {
  privacyLevel: string;
  isVerified?: boolean;
  needsVerification?: boolean;
  giftSource?: "wishlist" | "ai" | "both";
}

// Mock data for upcoming events
const upcomingEvents: ExtendedEventData[] = [
  {
    id: 1,
    type: "Birthday",
    person: "Alex Johnson",
    date: "May 15, 2023",
    daysAway: 14,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: true,
    autoGiftAmount: 75,
    privacyLevel: "shared",
    isVerified: true,
    giftSource: "wishlist"
  },
  {
    id: 2,
    type: "Anniversary",
    person: "Jamie Smith",
    date: "June 22, 2023",
    daysAway: 30,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: false,
    privacyLevel: "private",
    giftSource: "wishlist"
  },
  {
    id: 3,
    type: "Christmas",
    person: "Taylor Wilson",
    date: "December 25, 2023",
    daysAway: 90,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: true,
    autoGiftAmount: 100,
    privacyLevel: "public",
    giftSource: "both"
  },
  {
    id: 4, 
    type: "Wedding Anniversary",
    person: "Chris & Robin",
    date: "July 15, 2023",
    daysAway: 45,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: false,
    privacyLevel: "shared",
    isVerified: false,
    needsVerification: true,
    giftSource: "wishlist"
  }
];

interface UpcomingEventsProps {
  onAddEvent?: () => void;
}

const UpcomingEvents = ({ onAddEvent }: UpcomingEventsProps) => {
  const [events, setEvents] = useState<ExtendedEventData[]>(upcomingEvents);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<ExtendedEventData | null>(null);
  
  const handleAddEvent = () => {
    if (onAddEvent) {
      onAddEvent();
    } else {
      console.log("Add new event");
      // Default implementation for adding a new event
    }
  };

  const handleSendGift = (id: number) => {
    console.log(`Send gift for event ${id}`);
    toast.success("Gift selection opened");
    // Implementation for sending a gift
  };

  const handleToggleAutoGift = (id: number) => {
    console.log(`Toggle auto-gift for event ${id}`);
    setEvents(events.map(event => 
      event.id === id 
        ? { ...event, autoGiftEnabled: !event.autoGiftEnabled } 
        : event
    ));
    
    const event = events.find(e => e.id === id);
    if (event) {
      toast.success(`Auto-gift ${event.autoGiftEnabled ? 'disabled' : 'enabled'} for ${event.person}'s ${event.type}`);
    }
  };
  
  const handleVerifyEvent = (id: number) => {
    console.log(`Verify event ${id}`);
    // In a real implementation, this would send a verification request
    setEvents(events.map(event => 
      event.id === id 
        ? { ...event, isVerified: true, needsVerification: false } 
        : event
    ));
    toast.success("Event verified successfully");
  };

  const handleEditEvent = (id: number) => {
    const eventToEdit = events.find(event => event.id === id);
    if (eventToEdit) {
      setCurrentEvent(eventToEdit);
      setIsEditDrawerOpen(true);
    }
  };

  const handleSaveEvent = (eventId: number, updatedEvent: Partial<ExtendedEventData>) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, ...updatedEvent } 
        : event
    ));
  };

  // Helper function to render privacy badge with tooltip
  const renderPrivacyBadge = (privacyLevel: string, isVerified?: boolean) => {
    let icon = null;
    let label = "";
    let variant = "outline";
    
    switch(privacyLevel) {
      case "private":
        icon = <ShieldOff className="h-3 w-3 mr-1" />;
        label = "Private";
        break;
      case "shared":
        icon = isVerified 
          ? <ShieldCheck className="h-3 w-3 mr-1 text-green-500" /> 
          : <Shield className="h-3 w-3 mr-1 text-amber-500" />;
        label = isVerified ? "Verified" : "Shared";
        variant = isVerified ? "success" : "warning";
        break;
      case "public":
        icon = <Shield className="h-3 w-3 mr-1" />;
        label = "Public";
        break;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={variant as any} className="ml-2 cursor-help">
              {icon}
              {label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {privacyLevel === "private" && "Only visible to you"}
            {privacyLevel === "shared" && isVerified && "Event has been verified by the other person"}
            {privacyLevel === "shared" && !isVerified && "Shared but awaiting verification"}
            {privacyLevel === "public" && "Visible to everyone"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div>
      <EventHeader title="Upcoming Gift Occasions" onAddEvent={handleAddEvent} />
      
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Manage important dates and automate gift-giving. Shared events can be verified by connected users for accuracy.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard 
            key={event.id}
            event={event}
            onSendGift={handleSendGift}
            onToggleAutoGift={handleToggleAutoGift}
            onEdit={handleEditEvent}
            extraContent={
              <>
                {event.privacyLevel && renderPrivacyBadge(event.privacyLevel, event.isVerified)}
                {event.needsVerification && (
                  <div className="mt-2">
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-amber-50 border-amber-300"
                      onClick={() => handleVerifyEvent(event.id)}
                    >
                      Verify Event
                    </Badge>
                  </div>
                )}
              </>
            }
          />
        ))}
      </div>

      <EventEditDrawer 
        event={currentEvent}
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        onSave={handleSaveEvent}
      />
    </div>
  );
};

export default UpcomingEvents;
