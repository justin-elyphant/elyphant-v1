
import React, { useMemo } from "react";
import EventsSearchAndFilter from "../../enhanced/EventsSearchAndFilter";
import EventsSorting from "../../enhanced/EventsSorting";
import { ExtendedEventData } from "../../types";
import type { FilterState } from "../../enhanced/EventsSearchAndFilter";
import type { SortState } from "../../enhanced/EventsSorting";

interface EnhancedEventsFiltersProps {
  events: ExtendedEventData[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  sortState: SortState;
  onSortChange: (sortState: SortState) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const EnhancedEventsFilters = ({
  events,
  filters,
  onFiltersChange,
  sortState,
  onSortChange,
  onClearFilters,
  activeFiltersCount,
}: EnhancedEventsFiltersProps) => {
  const availableEventTypes = useMemo(() => {
    return Array.from(new Set(events.map(event => event.type))).sort();
  }, [events]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
      <EventsSearchAndFilter 
        filters={filters}
        onFiltersChange={onFiltersChange}
        availableEventTypes={availableEventTypes}
        onClearFilters={onClearFilters}
        activeFiltersCount={activeFiltersCount}
      />
      <EventsSorting 
        sortState={sortState}
        onSortChange={onSortChange}
      />
    </div>
  );
};

export default EnhancedEventsFilters;
