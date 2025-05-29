
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EventViewToggle from "./EventViewToggle";
import EventTypeFilter from "./EventTypeFilter";

interface EventHeaderProps {
  view: "cards" | "calendar";
  onViewChange: (mode: "cards" | "calendar") => void;
  onAddEvent: () => void;
  eventTypes: string[];
  selectedEventType: string;
  onEventTypeChange: (type: string) => void;
}

const EventHeader = ({ 
  view, 
  onViewChange, 
  onAddEvent, 
  eventTypes, 
  selectedEventType, 
  onEventTypeChange 
}: EventHeaderProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Events</h2>
        <Button onClick={onAddEvent}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <EventTypeFilter 
          eventTypes={eventTypes} 
          selectedType={selectedEventType}
          onTypeChange={onEventTypeChange}
        />
        
        <EventViewToggle 
          viewMode={view}
          onViewModeChange={onViewChange}
        />
      </div>
    </div>
  );
};

export default EventHeader;
