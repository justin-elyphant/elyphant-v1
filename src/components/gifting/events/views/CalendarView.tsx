
import React from "react";
import { ExtendedEventData } from "../types";

interface EventCalendarViewProps {
  events: ExtendedEventData[];
  onSendGift: (id: string) => void;
  onToggleAutoGift: (id: string) => void;
  onEdit: (id: string) => void;
  onVerifyEvent: (id: string) => void;
  onEventClick: (event: ExtendedEventData) => void;
}

const CalendarView = ({
  events,
  onSendGift,
  onToggleAutoGift,
  onEdit,
  onVerifyEvent,
  onEventClick
}: EventCalendarViewProps) => {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Calendar View</h3>
        <p className="text-muted-foreground mb-4">
          Calendar view is under development. For now, please use the cards view.
        </p>
        <p className="text-sm text-muted-foreground">
          {events.length} event{events.length !== 1 ? 's' : ''} available
        </p>
      </div>
    </div>
  );
};

export default CalendarView;
