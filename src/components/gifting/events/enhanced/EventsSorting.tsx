
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type SortField = 'date' | 'person' | 'type' | 'priority' | 'created';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

interface EventsSortingProps {
  sortState: SortState;
  onSortChange: (sortState: SortState) => void;
}

const EventsSorting = ({ sortState, onSortChange }: EventsSortingProps) => {
  const handleFieldChange = (field: SortField) => {
    onSortChange({ ...sortState, field });
  };

  const handleDirectionToggle = () => {
    onSortChange({
      ...sortState,
      direction: sortState.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'person', label: 'Person' },
    { value: 'type', label: 'Event Type' },
    { value: 'priority', label: 'Priority' },
    { value: 'created', label: 'Created' },
  ];

  const SortIcon = sortState.direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <Select value={sortState.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-32 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDirectionToggle}
        className="h-8 w-8 p-0"
      >
        <SortIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default EventsSorting;
