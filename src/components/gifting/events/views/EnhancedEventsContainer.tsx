
import React, { useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useEvents } from "../context/EventsContext";
import { useEventHandlers } from "../hooks/useEventHandlers";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import EventHeader from "../EventHeader";
import EventsLoadingState from "../components/EventsLoadingState";
import EmptyEventsState from "../components/EmptyEventsState";
import EventNotifications from "../notifications/EventNotifications";
import ExportImportDialog from "../export-import/ExportImportDialog";
import AccessibleEventCard from "../components/AccessibleEventCard";
import CalendarView from "./CalendarView";
import { FilterOption } from "../types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EnhancedEventsContainerProps {
  onAddEvent: () => void;
}

const EnhancedEventsContainer = ({ onAddEvent }: EnhancedEventsContainerProps) => {
  const [view, setView] = useState<"cards" | "calendar">("cards");
  const [selectedEventType, setSelectedEventType] = useState<FilterOption>("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showExportImport, setShowExportImport] = useState(false);
  
  const { events, isLoading, updateEvent } = useEvents();
  const { 
    handleSendGift, 
    handleToggleAutoGift, 
    handleEditEvent, 
    handleVerifyEvent,
    handleDeleteEvent 
  } = useEventHandlers();

  // Keyboard navigation
  useKeyboardNavigation({
    events,
    selectedEventId,
    onSelectEvent: setSelectedEventId,
    onEditEvent: handleEditEvent,
    onDeleteEvent: handleDeleteEvent,
  });

  // Filter events based on selected type
  const filteredEvents = selectedEventType === "all" 
    ? events 
    : events.filter(event => event.type === selectedEventType);

  // Get unique event types for filter
  const eventTypes = Array.from(new Set(events.map(event => event.type)));

  const handleEventClick = (event: any) => {
    setSelectedEventId(event.id);
    handleEditEvent(event.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Handle event rescheduling
      const eventId = active.id as string;
      const newDate = new Date(over.id as string);
      
      console.log(`Rescheduling event ${eventId} to ${newDate}`);
      // Here you would call updateEvent with the new date
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <EventNotifications />
        <EventsLoadingState />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyEventsState
          title="No events yet"
          description="Start building your gift calendar by adding important dates for friends and family."
          actionLabel="Add Your First Event"
          onAction={onAddEvent}
        />
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <EventNotifications />
        
        <div className="flex items-center justify-between">
          <EventHeader 
            view={view}
            onViewChange={setView}
            onAddEvent={onAddEvent}
            eventTypes={eventTypes}
            selectedEventType={selectedEventType}
            onEventTypeChange={setSelectedEventType}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowExportImport(true)}>
                Export / Import Events
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {view === "cards" ? (
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            role="grid"
            aria-label="Events grid"
          >
            {filteredEvents.map((event) => (
              <div key={event.id} role="gridcell">
                <AccessibleEventCard
                  event={event}
                  isSelected={selectedEventId === event.id}
                  onSendGift={() => handleSendGift(event.id)}
                  onToggleAutoGift={() => handleToggleAutoGift(event.id)}
                  onEdit={() => handleEditEvent(event.id)}
                  onVerifyEvent={() => handleVerifyEvent(event.id)}
                  onClick={() => setSelectedEventId(event.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <CalendarView
            events={filteredEvents}
            onSendGift={handleSendGift}
            onToggleAutoGift={handleToggleAutoGift}
            onEdit={handleEditEvent}
            onVerifyEvent={handleVerifyEvent}
            onEventClick={handleEventClick}
            onDelete={handleDeleteEvent}
            eventTypes={eventTypes}
            selectedEventType={selectedEventType}
            onEventTypeChange={setSelectedEventType}
          />
        )}

        <ExportImportDialog 
          open={showExportImport}
          onOpenChange={setShowExportImport}
        />
      </div>
    </DndContext>
  );
};

export default EnhancedEventsContainer;
