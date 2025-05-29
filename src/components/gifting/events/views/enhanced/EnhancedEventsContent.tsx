
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import EnhancedEventsListView from "../../enhanced/EnhancedEventsListView";
import CalendarView from "../CalendarView";
import EventCardsView from "../../EventCardsView";
import { ExtendedEventData } from "../../types";

interface EnhancedEventsContentProps {
  viewMode: "cards" | "calendar" | "list";
  filteredEvents: ExtendedEventData[];
  availableEventTypes: string[];
  selectedEventType: string;
  onEventTypeChange: (type: string) => void;
  onEventClick: (event: ExtendedEventData) => void;
  onSendGift: (id: string) => void;
  onToggleAutoGift: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onVerifyEvent: (id: string) => void;
}

const EnhancedEventsContent = ({
  viewMode,
  filteredEvents,
  availableEventTypes,
  selectedEventType,
  onEventTypeChange,
  onEventClick,
  onSendGift,
  onToggleAutoGift,
  onEdit,
  onDelete,
  onVerifyEvent,
}: EnhancedEventsContentProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        {viewMode === "calendar" ? (
          <CalendarView 
            events={filteredEvents}
            onEventClick={onEventClick}
            onSendGift={onSendGift}
            onToggleAutoGift={onToggleAutoGift}
            onEdit={onEdit}
            onVerifyEvent={onVerifyEvent}
            onDelete={onDelete}
            eventTypes={availableEventTypes}
            selectedEventType={selectedEventType}
            onEventTypeChange={onEventTypeChange}
          />
        ) : viewMode === "cards" ? (
          <EventCardsView
            events={filteredEvents}
            onSendGift={onSendGift}
            onToggleAutoGift={onToggleAutoGift}
            onEdit={onEdit}
            onDelete={onDelete}
            onVerifyEvent={onVerifyEvent}
            onEventClick={onEventClick}
          />
        ) : (
          <EnhancedEventsListView
            events={filteredEvents}
            onEdit={onEdit}
            onSendGift={onSendGift}
            onToggleAutoGift={onToggleAutoGift}
            onVerifyEvent={onVerifyEvent}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedEventsContent;
