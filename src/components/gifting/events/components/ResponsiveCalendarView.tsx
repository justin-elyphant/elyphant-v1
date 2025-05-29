
import React from "react";
import { ExtendedEventData } from "../types";
import EnhancedCalendar from "./EnhancedCalendar";
import CalendarHeader from "./CalendarHeader";
import MonthEventsPanel from "./MonthEventsPanel";
import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { FilterOption } from "../types";

interface ResponsiveCalendarViewProps {
  events: ExtendedEventData[];
  onEventClick: (event: ExtendedEventData) => void;
  onSendGift?: (id: string) => void;
  onToggleAutoGift?: (id: string) => void;
  onVerifyEvent?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  eventTypes: string[];
  selectedEventType: FilterOption;
  onEventTypeChange: (type: FilterOption) => void;
}

const ResponsiveCalendarView = ({
  events,
  onEventClick,
  onSendGift,
  onToggleAutoGift,
  onVerifyEvent,
  onEdit,
  onDelete,
  eventTypes,
  selectedEventType,
  onEventTypeChange
}: ResponsiveCalendarViewProps) => {
  const {
    selectedDate,
    setSelectedDate,
    currentMonthEvents,
    selectedDateEvents,
    getEventsForDay,
    goToPreviousMonth,
    goToToday,
    goToNextMonth
  } = useCalendarEvents(events, selectedEventType);

  return (
    <div className="bg-white rounded-lg border p-4 md:p-6">
      <CalendarHeader
        eventTypes={eventTypes}
        selectedEventType={selectedEventType}
        onEventTypeChange={onEventTypeChange}
        selectedDate={selectedDate}
        goToPreviousMonth={goToPreviousMonth}
        goToToday={goToToday}
        goToNextMonth={goToNextMonth}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar - takes full width on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2">
          <EnhancedCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            getEventsForDay={getEventsForDay}
            onEventClick={onEventClick}
            onSendGift={onSendGift}
            onToggleAutoGift={onToggleAutoGift}
            onVerifyEvent={onVerifyEvent}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
        
        {/* Events panel - stacks below on mobile, sidebar on desktop */}
        <div className="lg:col-span-1">
          <MonthEventsPanel
            selectedDate={selectedDate}
            currentMonthEvents={currentMonthEvents}
            selectedDateEvents={selectedDateEvents}
            onEventClick={onEventClick}
            onSendGift={onSendGift}
            onToggleAutoGift={onToggleAutoGift}
          />
        </div>
      </div>
    </div>
  );
};

export default ResponsiveCalendarView;
