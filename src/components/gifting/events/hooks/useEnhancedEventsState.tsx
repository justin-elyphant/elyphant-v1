
import { useState, useMemo } from "react";
import { ExtendedEventData } from "../types";
import type { FilterState } from "../enhanced/EventsSearchAndFilter";
import type { SortState } from "../enhanced/EventsSorting";

export const useEnhancedEventsState = (events: ExtendedEventData[]) => {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    eventTypes: [],
    dateRange: { from: null, to: null },
    autoGiftStatus: 'all',
    urgencyLevel: 'all',
  });
  const [sortState, setSortState] = useState<SortState>({
    field: 'date',
    direction: 'asc',
  });

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    let filtered = events.filter(event => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          event.person.toLowerCase().includes(searchLower) ||
          event.type.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Event type filter
      if (filters.eventTypes.length > 0) {
        if (!filters.eventTypes.includes(event.type)) return false;
      }

      // Auto-gift status filter
      if (filters.autoGiftStatus !== 'all') {
        const hasAutoGift = event.autoGiftEnabled;
        if (filters.autoGiftStatus === 'enabled' && !hasAutoGift) return false;
        if (filters.autoGiftStatus === 'disabled' && hasAutoGift) return false;
      }

      return true;
    });

    // Sort events
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortState.field) {
        case 'date':
          comparison = a.daysAway - b.daysAway;
          break;
        case 'person':
          comparison = a.person.localeCompare(b.person);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = 0;
      }

      return sortState.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [events, filters, sortState]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.eventTypes.length > 0) count++;
    if (filters.autoGiftStatus !== 'all') count++;
    if (filters.urgencyLevel !== 'all') count++;
    return count;
  }, [filters]);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      eventTypes: [],
      dateRange: { from: null, to: null },
      autoGiftStatus: 'all',
      urgencyLevel: 'all',
    });
  };

  return {
    selectedEvents,
    setSelectedEvents,
    isExportImportOpen,
    setIsExportImportOpen,
    isAddEventOpen,
    setIsAddEventOpen,
    filters,
    setFilters,
    sortState,
    setSortState,
    filteredEvents,
    activeFiltersCount,
    handleClearFilters,
  };
};
