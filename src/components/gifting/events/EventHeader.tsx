
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Events</h2>
        <Button onClick={onAddEvent} className="w-full sm:w-auto min-h-[44px] touch-manipulation">
          <Plus className="mr-2 h-4 w-4" />
          Set Up Gifting
        </Button>
      </div>
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="w-full lg:w-auto">
          <EventTypeFilter 
            eventTypes={eventTypes} 
            selectedType={selectedEventType}
            onTypeChange={onEventTypeChange}
          />
        </div>
        
        <div className="w-full lg:w-auto">
          <EventViewToggle 
            viewMode={view}
            onViewModeChange={onViewChange}
          />
        </div>
      </div>
    </div>
  );
};

export default EventHeader;
