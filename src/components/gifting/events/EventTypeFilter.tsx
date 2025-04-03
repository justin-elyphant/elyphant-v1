
import React from "react";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterOption } from "./types";

interface EventTypeFilterProps {
  eventTypes: string[];
  selectedType: FilterOption;
  onTypeChange: (type: FilterOption) => void;
}

const EventTypeFilter = ({
  eventTypes,
  selectedType,
  onTypeChange,
}: EventTypeFilterProps) => {
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
          {eventTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default EventTypeFilter;
