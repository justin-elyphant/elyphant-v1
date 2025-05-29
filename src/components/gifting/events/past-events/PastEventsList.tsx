
import React from "react";
import { ExtendedEventData } from "../types";
import PastEventCard from "./PastEventCard";

interface PastEventsListProps {
  events: ExtendedEventData[];
}

const PastEventsList = ({ events }: PastEventsListProps) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-md border">
        <h3 className="text-lg font-medium mb-2">No events found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters to see more events
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => (
        <PastEventCard key={event.id} event={event} />
      ))}
    </div>
  );
};

export default PastEventsList;
