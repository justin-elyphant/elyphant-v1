
import React from "react";
import { ExtendedEventData } from "../types";
import ResponsiveCalendarView from "../components/ResponsiveCalendarView";
import { FilterOption } from "../types";

interface EventCalendarViewProps {
  events: ExtendedEventData[];
  onSendGift: (id: string) => void;
  onToggleAutoGift: (id: string) => void;
  onEdit: (id: string) => void;
  onVerifyEvent: (id: string) => void;
  onEventClick: (event: ExtendedEventData) => void;
  onDelete?: (id: string) => void;
  eventTypes: string[];
  selectedEventType: FilterOption;
  onEventTypeChange: (type: FilterOption) => void;
}

const CalendarView = ({
  events,
  onSendGift,
  onToggleAutoGift,
  onEdit,
  onVerifyEvent,
  onEventClick,
  onDelete,
  eventTypes,
  selectedEventType,
  onEventTypeChange
}: EventCalendarViewProps) => {
  return (
    <ResponsiveCalendarView
      events={events}
      onEventClick={onEventClick}
      onSendGift={onSendGift}
      onToggleAutoGift={onToggleAutoGift}
      onVerifyEvent={onVerifyEvent}
      onEdit={onEdit}
      onDelete={onDelete}
      eventTypes={eventTypes}
      selectedEventType={selectedEventType}
      onEventTypeChange={onEventTypeChange}
    />
  );
};

export default CalendarView;
