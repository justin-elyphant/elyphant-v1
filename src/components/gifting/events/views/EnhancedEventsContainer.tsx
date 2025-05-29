
import React, { useState } from "react";
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

interface EnhancedEventsContainerProps {
  onAddEvent: () => void;
}

const EnhancedEventsContainer = ({ onAddEvent }: EnhancedEventsContainerProps) => {
  const { 
    events, 
    isLoading, 
    error, 
    viewMode, 
    selectedEventType,
    setEditingEvent
  } = useEvents();
  
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  
  const {
    filteredEvents,
    handleSendGift,
    handleToggleAutoGift,
    handleEdit,
    handleDelete,
    handleVerifyEvent,
    handleEventClick
  } = useEventHandlers();

  const handleAddEvent = () => {
    setIsAddEventOpen(true);
  };

  const handleBulkDelete = () => {
    // Implementation for bulk delete
    console.log('Bulk delete:', selectedEvents);
  };

  const handleBulkEdit = () => {
    // Implementation for bulk edit
    console.log('Bulk edit:', selectedEvents);
  };

  if (isLoading) {
    return <div>Loading events...</div>;
  }

  if (error) {
    return <div>Error loading events: {error}</div>;
  }

  if (events.length === 0) {
    return <EmptyEventsState onAddEvent={handleAddEvent} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <EventsSearchAndFilter />
          <EventsSorting />
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
        <EventViewToggle />
        
        {selectedEvents.length > 0 && (
          <BulkActions
            selectedCount={selectedEvents.length}
            onBulkDelete={handleBulkDelete}
            onBulkEdit={handleBulkEdit}
            onClearSelection={() => setSelectedEvents([])}
          />
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          {viewMode === "calendar" ? (
            <CalendarView 
              events={filteredEvents}
              onEventClick={handleEventClick}
            />
          ) : viewMode === "cards" ? (
            <EventCardsView
              events={filteredEvents}
              onSendGift={handleSendGift}
              onToggleAutoGift={handleToggleAutoGift}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onVerifyEvent={handleVerifyEvent}
              onEventClick={handleEventClick}
            />
          ) : (
            <EnhancedEventsListView
              events={filteredEvents}
              selectedEvents={selectedEvents}
              onSelectionChange={setSelectedEvents}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
