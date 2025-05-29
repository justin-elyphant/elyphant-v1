
import React from "react";
import EventCardSkeleton from "./EventCardSkeleton";

interface EventsLoadingStateProps {
  count?: number;
}

const EventsLoadingState = ({ count = 6 }: EventsLoadingStateProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default EventsLoadingState;
