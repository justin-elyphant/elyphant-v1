
import React from "react";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterOption, ExtendedEventData } from "./types";

interface EventTypeFilterProps {
  selectedType: FilterOption;
  onTypeChange: (type: FilterOption) => void;
  events?: ExtendedEventData[];
  eventTypes?: string[];
}

const EventTypeFilter = ({
  selectedType,
  onTypeChange,
  events,
  eventTypes,
}: EventTypeFilterProps) => {
  // Use provided eventTypes if available, otherwise extract from events
  const availableEventTypes = eventTypes || 
    (events ? Array.from(new Set(events.map(event => event.type.toLowerCase()))) : []);

  return (
    <div className="flex items-center space-x-2 mb-4">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedType}
        onValueChange={(value) => onTypeChange(value as FilterOption)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Events</SelectItem>
          {availableEventTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default EventTypeFilter;
