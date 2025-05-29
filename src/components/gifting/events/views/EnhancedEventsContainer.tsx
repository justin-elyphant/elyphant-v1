
import React, { useMemo } from "react";
import ExportImportDialog from "../export-import/ExportImportDialog";
import AddEventDialog from "../add-dialog/AddEventDialog";
import EmptyEventsState from "../components/EmptyEventsState";
import EnhancedEventsToolbar from "./enhanced/EnhancedEventsToolbar";
import EnhancedEventsFilters from "./enhanced/EnhancedEventsFilters";
import EnhancedEventsContent from "./enhanced/EnhancedEventsContent";
import { useEvents } from "../context/EventsContext";
import { useEventHandlers } from "../hooks/useEventHandlers";
import { useEnhancedEventsState } from "../hooks/useEnhancedEventsState";

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
  
  const {
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
  } = useEnhancedEventsState(events);
  
  const {
    handleSendGift,
    handleToggleAutoGift,
    handleEditEvent,
    handleDeleteEvent,
    handleVerifyEvent,
    handleEventClick
  } = useEventHandlers();

  const availableEventTypes = useMemo(() => {
    return Array.from(new Set(events.map(event => event.type))).sort();
  }, [events]);

  const handleAddEvent = () => {
    setIsAddEventOpen(true);
  };

  const handleBulkDelete = () => {
    console.log('Bulk delete:', selectedEvents);
  };

  const handleBulkEdit = () => {
    console.log('Bulk edit:', selectedEvents);
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
      <EnhancedEventsFilters
        events={events}
        filters={filters}
        onFiltersChange={setFilters}
        sortState={sortState}
        onSortChange={setSortState}
        onClearFilters={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <EnhancedEventsToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedEvents={selectedEvents}
        filteredEvents={filteredEvents}
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
        onAddEvent={handleAddEvent}
        onExportImport={() => setIsExportImportOpen(true)}
      />

      <EnhancedEventsContent
        viewMode={viewMode}
        filteredEvents={filteredEvents}
        availableEventTypes={availableEventTypes}
        selectedEventType={selectedEventType}
        onEventTypeChange={setSelectedEventType}
        onEventClick={handleEventClick}
        onSendGift={handleSendGift}
        onToggleAutoGift={handleToggleAutoGift}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onVerifyEvent={handleVerifyEvent}
      />

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
