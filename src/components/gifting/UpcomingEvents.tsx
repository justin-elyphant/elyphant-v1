import React, { useState } from "react";
import { toast } from "sonner";
import EventHeader from "./events/EventHeader";
import EventEditDrawer from "./events/EventEditDrawer";
import EventCalendarView from "./events/EventCalendarView";
import EventCardsView from "./events/EventCardsView";
import EventViewToggle from "./events/EventViewToggle";
import { ExtendedEventData } from "./events/types";

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
  const [viewMode, setViewMode] = useState<"cards" | "calendar">("cards");
  
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
    // Find the event to make sure it exists before showing the toast
    const event = events.find(e => e.id === id);
    if (event) {
      toast.success(`Gift selection opened for ${event.person}'s ${event.type}`);
    }
  };

  const handleToggleAutoGift = (id: number) => {
    console.log(`Toggle auto-gift for event ${id}`);
    
    // Create a new copy of the events array with the updated autoGiftEnabled value
    const updatedEvents = events.map(event => 
      event.id === id 
        ? { 
            ...event, 
            autoGiftEnabled: !event.autoGiftEnabled,
            // If enabling auto-gift and no amount is set, set a default
            autoGiftAmount: !event.autoGiftEnabled && !event.autoGiftAmount ? 50 : event.autoGiftAmount,
            // If enabling auto-gift and no source is set, default to wishlist
            giftSource: !event.autoGiftEnabled && !event.giftSource ? "wishlist" : event.giftSource
          } 
        : event
    );
    
    // Update the state with the new array
    setEvents(updatedEvents);
    
    const event = events.find(e => e.id === id);
    if (event) {
      toast.success(`Auto-gift ${event.autoGiftEnabled ? 'disabled' : 'enabled'} for ${event.person}'s ${event.type}`);
    }
  };
  
  const handleVerifyEvent = (id: number) => {
    console.log(`Verify event ${id}`);
    // Create a new copy of the events array with the updated verification status
    const updatedEvents = events.map(event => 
      event.id === id 
        ? { ...event, isVerified: true, needsVerification: false } 
        : event
    );
    
    // Update the state with the new array
    setEvents(updatedEvents);
    toast.success("Event verified successfully");
  };

  const handleEditEvent = (id: number) => {
    const eventToEdit = events.find(event => event.id === id);
    if (eventToEdit) {
      // Set the current event for editing
      setCurrentEvent(eventToEdit);
      // Open the edit drawer
      setIsEditDrawerOpen(true);
    }
  };

  const handleSaveEvent = (eventId: number, updatedEvent: Partial<ExtendedEventData>) => {
    const updatedEvents = events.map(event => 
      event.id === eventId 
        ? { ...event, ...updatedEvent } 
        : event
    );
    
    // Update the state with the new array
    setEvents(updatedEvents);
    toast.success("Event updated successfully");
  };

  const handleEventClick = (event: ExtendedEventData) => {
    setCurrentEvent(event);
    setIsEditDrawerOpen(true);
  };

  return (
    <div>
      <EventHeader title="Upcoming Gift Occasions" onAddEvent={handleAddEvent} />
      
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Manage important dates and automate gift-giving. Shared events can be verified by connected users for accuracy.
        </p>
      </div>
      
      <EventViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      
      {viewMode === "cards" ? (
        <EventCardsView 
          events={events}
          onSendGift={handleSendGift}
          onToggleAutoGift={handleToggleAutoGift}
          onEdit={handleEditEvent}
          onVerifyEvent={handleVerifyEvent}
        />
      ) : (
        <EventCalendarView 
          events={events} 
          onEventClick={handleEventClick}
          onSendGift={handleSendGift}
          onToggleAutoGift={handleToggleAutoGift}
          onVerifyEvent={handleVerifyEvent} 
        />
      )}

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
