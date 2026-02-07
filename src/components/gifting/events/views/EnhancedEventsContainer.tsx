
import React, { useMemo } from "react";
import ExportImportDialog from "../export-import/ExportImportDialog";
// AutoGiftSetupFlow removed - consolidated into UnifiedGiftSchedulingModal
import EmptyEventsState from "../components/EmptyEventsState";
import EnhancedEventsToolbar from "./enhanced/EnhancedEventsToolbar";
import EnhancedEventsFilters from "./enhanced/EnhancedEventsFilters";
import EnhancedEventsContent from "./enhanced/EnhancedEventsContent";
import { useEvents } from "../context/EventsContext";
import { useEventHandlers } from "../hooks/useEventHandlers";
import { useEnhancedEventsState } from "../hooks/useEnhancedEventsState";
import { ExtendedEventData } from "../types";

interface EnhancedEventsContainerProps {
  onAddEvent: () => void;
  events?: ExtendedEventData[]; // Optional filtered events to display
}

const EnhancedEventsContainer = ({ onAddEvent, events: providedEvents }: EnhancedEventsContainerProps) => {
  const { 
    events: contextEvents, 
    isLoading, 
    error, 
    viewMode, 
    setViewMode,
    selectedEventType,
    setSelectedEventType
  } = useEvents();
  
  // Use provided events or fall back to context events
  const events = providedEvents || contextEvents;
  
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

  // Determine appropriate messaging based on event category
  const getEmptyStateMessage = () => {
    if (providedEvents && providedEvents.length === 0) {
      const firstEvent = contextEvents[0];
      if (firstEvent?.eventCategory === 'self') {
        return {
          title: "No personal events yet",
          description: "Add your birthday, graduation, or other special occasions where friends can send you gifts.",
          actionLabel: "Add My Event"
        };
      } else if (firstEvent?.eventCategory === 'shared') {
        return {
          title: "No shared events yet", 
          description: "Add anniversaries, Valentine's Day, or other occasions you celebrate together.",
          actionLabel: "Add Shared Event"
        };
      } else {
        return {
          title: "No upcoming gifts scheduled",
          description: "Set up automated gifting for friends and family birthdays and special occasions.",
          actionLabel: "Set Up Gift"
        };
      }
    }
    
    return {
      title: "No events yet",
      description: "Add your first event to start tracking important dates and occasions.",
      actionLabel: "Add Event"
    };
  };

  if (isLoading) {
    return <div>Loading events...</div>;
  }

  if (error) {
    return <div>Error loading events: {error}</div>;
  }

  if (events.length === 0) {
    const emptyState = getEmptyStateMessage();
    return (
      <EmptyEventsState 
        title={emptyState.title}
        description={emptyState.description}
        actionLabel={emptyState.actionLabel}
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

      {/* Gift Setup integrated into Nicole AI flow */}
    </div>
  );
};

export default EnhancedEventsContainer;
