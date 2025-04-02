
import React from "react";
import EventHeader from "./events/EventHeader";
import EventCard, { EventData } from "./events/EventCard";

// Mock data for upcoming events
const upcomingEvents = [
  {
    id: 1,
    type: "Birthday",
    person: "Alex Johnson",
    date: "May 15, 2023",
    daysAway: 14,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: true,
    autoGiftAmount: 75
  },
  {
    id: 2,
    type: "Anniversary",
    person: "Jamie Smith",
    date: "June 22, 2023",
    daysAway: 30,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: false
  },
  {
    id: 3,
    type: "Christmas",
    person: "Taylor Wilson",
    date: "December 25, 2023",
    daysAway: 90,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: true,
    autoGiftAmount: 100
  }
];

interface UpcomingEventsProps {
  onAddEvent?: () => void;
}

const UpcomingEvents = ({ onAddEvent }: UpcomingEventsProps) => {
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
    // Implementation for sending a gift
  };

  const handleToggleAutoGift = (id: number) => {
    console.log(`Toggle auto-gift for event ${id}`);
    // Implementation for toggling auto-gift
  };

  return (
    <div>
      <EventHeader title="Upcoming Gift Occasions" onAddEvent={handleAddEvent} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingEvents.map((event: EventData) => (
          <EventCard 
            key={event.id}
            event={event}
            onSendGift={handleSendGift}
            onToggleAutoGift={handleToggleAutoGift}
          />
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
