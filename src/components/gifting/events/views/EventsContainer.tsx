
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import EventCardsView from "../EventCardsView";
import CalendarView from "./CalendarView";
import EventTypeFilter from "../EventTypeFilter";
import EventViewToggle from "../EventViewToggle";
import { useEvents } from "../context/EventsContext";
import { useEventHandlers } from "../hooks/useEventHandlers";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";

interface EventsContainerProps {
  onAddEvent: () => void;
}

const EventsContainer = ({ onAddEvent }: EventsContainerProps) => {
  const {
    events,
    viewMode,
    setViewMode,
    selectedEventType,
    setSelectedEventType,
    isLoading,
    error,
    refreshEvents
  } = useEvents();

  const {
    handleSendGift,
    handleToggleAutoGift,
    handleEditEvent,
    handleVerifyEvent,
    handleEventClick
  } = useEventHandlers();

  // Filter events based on selected type
  const filteredEvents = selectedEventType === "all" 
    ? events 
    : events.filter(event => event.type.toLowerCase() === selectedEventType.toLowerCase());

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header with skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Filters skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-40 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Loading content */}
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Loading your events...</h3>
              <p className="text-muted-foreground">Please wait while we fetch your special dates</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          <Button onClick={onAddEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>

        {/* Error content */}
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Failed to load events</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={refreshEvents} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Upcoming Events</h2>
        <div className="flex items-center gap-2">
          <Button onClick={refreshEvents} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={onAddEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <EventTypeFilter 
          selectedType={selectedEventType}
          onTypeChange={setSelectedEventType}
          events={events}
        />
        <EventViewToggle 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Content */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding important dates like birthdays and anniversaries
              </p>
              <Button onClick={onAddEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Event
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "cards" ? (
            <EventCardsView
              events={filteredEvents}
              onSendGift={handleSendGift}
              onToggleAutoGift={handleToggleAutoGift}
              onEdit={handleEditEvent}
              onVerifyEvent={handleVerifyEvent}
              onEventClick={handleEventClick}
            />
          ) : (
            <CalendarView
              events={filteredEvents}
              onSendGift={handleSendGift}
              onToggleAutoGift={handleToggleAutoGift}
              onEdit={handleEditEvent}
              onVerifyEvent={handleVerifyEvent}
              onEventClick={handleEventClick}
            />
          )}
        </>
      )}
    </div>
  );
};

export default EventsContainer;
