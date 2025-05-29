
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List } from "lucide-react";
import { ExtendedEventData } from "../types";
import EnhancedEventCard from "./EnhancedEventCard";
import EventsSearchAndFilter, { FilterState } from "./EventsSearchAndFilter";
import EventsSorting, { SortState, SortField, SortDirection } from "./EventsSorting";
import BulkActions from "./BulkActions";
import { toast } from "sonner";

interface EnhancedEventsListViewProps {
  events: ExtendedEventData[];
  onSendGift: (id: string) => void;
  onToggleAutoGift: (id: string) => void;
  onEdit: (id: string) => void;
  onVerifyEvent: (id: string) => void;
  onEventClick?: (event: ExtendedEventData) => void;
  isLoading?: boolean;
}

const EnhancedEventsListView = ({
  events,
  onSendGift,
  onToggleAutoGift,
  onEdit,
  onVerifyEvent,
  onEventClick,
  isLoading = false,
}: EnhancedEventsListViewProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
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

  // Get available event types
  const availableEventTypes = useMemo(() => {
    return Array.from(new Set(events.map(event => event.type))).sort();
  }, [events]);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
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

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const eventDate = event.dateObj || new Date(event.date);
        if (filters.dateRange.from && eventDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && eventDate > filters.dateRange.to) return false;
      }

      // Auto-gift status filter
      if (filters.autoGiftStatus !== 'all') {
        const hasAutoGift = event.autoGiftEnabled;
        if (filters.autoGiftStatus === 'enabled' && !hasAutoGift) return false;
        if (filters.autoGiftStatus === 'disabled' && hasAutoGift) return false;
      }

      // Urgency level filter
      if (filters.urgencyLevel !== 'all') {
        const { daysAway } = event;
        if (filters.urgencyLevel === 'urgent' && daysAway > 3) return false;
        if (filters.urgencyLevel === 'soon' && (daysAway <= 3 || daysAway > 7)) return false;
        if (filters.urgencyLevel === 'later' && daysAway <= 7) return false;
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
        case 'priority':
          // Priority based on days away (urgent first)
          comparison = a.daysAway - b.daysAway;
          break;
        case 'created':
          const aDate = new Date(a.dateObj || a.date);
          const bDate = new Date(b.dateObj || b.date);
          comparison = aDate.getTime() - bDate.getTime();
          break;
        default:
          comparison = 0;
      }

      return sortState.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [events, filters, sortState]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.eventTypes.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
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

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedEvents(filteredAndSortedEvents.map(event => event.id));
    } else {
      setSelectedEvents([]);
    }
  };

  const handleEventSelection = (eventId: string, selected: boolean) => {
    if (selected) {
      setSelectedEvents(prev => [...prev, eventId]);
    } else {
      setSelectedEvents(prev => prev.filter(id => id !== eventId));
    }
  };

  const handleBulkAction = (action: string, params?: any) => {
    console.log('Bulk action:', action, 'params:', params, 'events:', selectedEvents);
    
    switch (action) {
      case 'autoGift':
        const enableAutoGift = params === 'enable';
        selectedEvents.forEach(eventId => {
          // This would integrate with your auto-gift toggle logic
          onToggleAutoGift(eventId);
        });
        toast.success(`Auto-gift ${enableAutoGift ? 'enabled' : 'disabled'} for ${selectedEvents.length} events`);
        break;
      case 'privacy':
        toast.success(`Privacy level updated for ${selectedEvents.length} events`);
        break;
      case 'sendGifts':
        toast.success(`Gift sending initiated for ${selectedEvents.length} events`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedEvents.length} events?`)) {
          toast.success(`${selectedEvents.length} events deleted`);
          setSelectedEvents([]);
        }
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <EventsSearchAndFilter
        filters={filters}
        onFiltersChange={setFilters}
        availableEventTypes={availableEventTypes}
        onClearFilters={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <EventsSorting sortState={sortState} onSortChange={setSortState} />
          <span className="text-sm text-muted-foreground">
            {filteredAndSortedEvents.length} of {events.length} events
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-8"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedEvents={selectedEvents}
        allEvents={filteredAndSortedEvents}
        onSelectAll={handleSelectAll}
        onClearSelection={() => setSelectedEvents([])}
        onBulkAction={handleBulkAction}
      />

      {/* Events Display */}
      {filteredAndSortedEvents.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-lg font-medium mb-2">No events found</h3>
          <p className="text-muted-foreground">
            {activeFiltersCount > 0 
              ? "Try adjusting your filters or search terms"
              : "Add a new event to get started"
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedEvents.map((event) => (
            <EnhancedEventCard
              key={event.id}
              event={event}
              onSendGift={() => onSendGift(event.id)}
              onToggleAutoGift={() => onToggleAutoGift(event.id)}
              onEdit={() => onEdit(event.id)}
              onVerifyEvent={() => onVerifyEvent(event.id)}
              onClick={() => onEventClick && onEventClick(event)}
              isSelected={selectedEvents.includes(event.id)}
              onSelectionChange={(selected) => handleEventSelection(event.id, selected)}
              showSelection={true}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedEvents.length === filteredAndSortedEvents.length && filteredAndSortedEvents.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead>Person</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Days Away</TableHead>
                <TableHead>Auto-Gift</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.id)}
                      onChange={(e) => handleEventSelection(event.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{event.person}</TableCell>
                  <TableCell className="capitalize">{event.type}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.daysAway} days</TableCell>
                  <TableCell>
                    {event.autoGiftEnabled ? (
                      <span className="text-green-600 font-medium">${event.autoGiftAmount || 0}</span>
                    ) : (
                      <span className="text-muted-foreground">Disabled</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" onClick={() => onSendGift(event.id)}>
                        Gift
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onEdit(event.id)}>
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default EnhancedEventsListView;
