
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import EventsSearchAndFilter from "../enhanced/EventsSearchAndFilter";
import EventsSorting from "../enhanced/EventsSorting";
import EventViewToggle from "../EventViewToggle";
import BulkActions from "../enhanced/BulkActions";
import EnhancedEventsListView from "../enhanced/EnhancedEventsListView";
import CalendarView from "./CalendarView";
import EventCardsView from "../EventCardsView";
import ExportImportDialog from "../export-import/ExportImportDialog";
import AddEventDialog from "../add-dialog/AddEventDialog";
import EmptyEventsState from "../components/EmptyEventsState";
import { useEvents } from "../context/EventsContext";
import { useEventHandlers } from "../hooks/useEventHandlers";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download } from "lucide-react";
import type { FilterState as EventsSearchFilterState } from "../enhanced/EventsSearchAndFilter";
import type { SortState as EventsSortState } from "../enhanced/EventsSorting";

interface EnhancedEventsContainerProps {
  onAddEvent: () => void;
}

const EnhancedEventsContainer = ({ onAddEvent }: EnhancedEventsContainerProps) => {
  const { 
    events, 
    isLoading, 
    error, 
    viewMode, 
    setViewMode,
    selectedEventType,
    setSelectedEventType
  } = useEvents();
  
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [filters, setFilters] = useState<EventsSearchFilterState>({
    search: '',
    eventTypes: [],
    dateRange: { from: null, to: null },
    autoGiftStatus: 'all',
    urgencyLevel: 'all',
  });
  const [sortState, setSortState] = useState<EventsSortState>({
    field: 'date',
    direction: 'asc',
  });
  
  const {
    handleSendGift,
    handleToggleAutoGift,
    handleEditEvent,
    handleDeleteEvent,
    handleVerifyEvent,
    handleEventClick
  } = useEventHandlers();

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

  const availableEventTypes = useMemo(() => {
    return Array.from(new Set(events.map(event => event.type))).sort();
  }, [events]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.eventTypes.length > 0) count++;
    if (filters.autoGiftStatus !== 'all') count++;
    if (filters.urgencyLevel !== 'all') count++;
    return count;
  }, [filters]);

  const handleAddEvent = () => {
    setIsAddEventOpen(true);
  };

  const handleBulkDelete = () => {
    console.log('Bulk delete:', selectedEvents);
  };

  const handleBulkEdit = () => {
    console.log('Bulk edit:', selectedEvents);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      eventTypes: [],
      dateRange: { from: null, to: null },
      autoGiftStatus: 'all',
      urgencyLevel: 'all',
    });
  };

  if (isLoading) {
    return <div>Loading events...</div>;
  }

  if (error) {
    return <div>Error loading events: {error}</div>;
  }

  if (events.length === 0) {
    return (
      <EmptyEventsState 
        title="No events yet"
        description="Add your first event to start tracking important dates and occasions."
        actionLabel="Add Event"
        onAction={handleAddEvent}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <EventsSearchAndFilter 
            filters={filters}
            onFiltersChange={setFilters}
            availableEventTypes={availableEventTypes}
            onClearFilters={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
          />
          <EventsSorting 
            sortState={sortState}
            onSortChange={setSortState}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportImportOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import/Export
          </Button>
          <Button
            size="sm"
            onClick={handleAddEvent}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <EventViewToggle 
          viewMode={viewMode as "cards" | "calendar"}
          onViewModeChange={(mode) => setViewMode(mode as "cards" | "calendar" | "list")}
        />
        
        {selectedEvents.length > 0 && (
          <BulkActions
            selectedEvents={selectedEvents}
            allEvents={filteredEvents}
            onSelectAll={(selected) => {
              if (selected) {
                setSelectedEvents(filteredEvents.map(event => event.id));
              } else {
                setSelectedEvents([]);
              }
            }}
            onClearSelection={() => setSelectedEvents([])}
            onBulkAction={(action) => {
              console.log('Bulk action:', action);
            }}
          />
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          {viewMode === "calendar" ? (
            <CalendarView 
              events={filteredEvents}
              onEventClick={handleEventClick}
              onSendGift={handleSendGift}
              onToggleAutoGift={handleToggleAutoGift}
              onEdit={handleEditEvent}
              onVerifyEvent={handleVerifyEvent}
              onDelete={handleDeleteEvent}
              eventTypes={availableEventTypes}
              selectedEventType={selectedEventType}
              onEventTypeChange={setSelectedEventType}
            />
          ) : viewMode === "cards" ? (
            <EventCardsView
              events={filteredEvents}
              onSendGift={handleSendGift}
              onToggleAutoGift={handleToggleAutoGift}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              onVerifyEvent={handleVerifyEvent}
              onEventClick={handleEventClick}
            />
          ) : (
            <EnhancedEventsListView
              events={filteredEvents}
              onEdit={handleEditEvent}
              onSendGift={handleSendGift}
              onToggleAutoGift={handleToggleAutoGift}
              onVerifyEvent={handleVerifyEvent}
            />
          )}
        </CardContent>
      </Card>

      <ExportImportDialog
        open={isExportImportOpen}
        onOpenChange={setIsExportImportOpen}
      />

      <AddEventDialog
        open={isAddEventOpen}
        onOpenChange={setIsAddEventOpen}
      />
    </div>
  );
};

export default EnhancedEventsContainer;
