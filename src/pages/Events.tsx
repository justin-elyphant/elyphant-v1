
import React from "react";
import EventsContent from "@/components/gifting/events/views/EnhancedEventsContainer";

const Events = () => {
  const handleAddEvent = () => {
    console.log("Add event from Events page");
  };

  return <EventsContent onAddEvent={handleAddEvent} />;
};

export default Events;
