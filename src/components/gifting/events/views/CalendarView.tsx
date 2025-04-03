
import React, { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ExtendedEventData, FilterOption } from "../types";
import { isToday } from "date-fns";
import { parseDateString } from "../utils/dateUtils";
import CalendarHeader from "../components/CalendarHeader";
import CalendarDayContent from "../components/CalendarDayContent";
import MonthEventsPanel from "../components/MonthEventsPanel";
import { useCalendarEvents } from "../hooks/useCalendarEvents";

interface EventCalendarViewProps {
  events: ExtendedEventData[];
  onEventClick: (event: ExtendedEventData) => void;
  onSendGift?: (id: number) => void;
  onToggleAutoGift?: (id: number) => void;
  onVerifyEvent?: (id: number) => void;
  selectedEventType: FilterOption;
  onEventTypeChange: (type: FilterOption) => void;
}

const EventCalendarView = ({ 
  events, 
  onEventClick, 
  onSendGift,
  onToggleAutoGift,
  onVerifyEvent,
  selectedEventType,
  onEventTypeChange
}: EventCalendarViewProps) => {
  // Get unique event types for the filter
  const eventTypes = Array.from(new Set(events.map(event => event.type)));
  
  const {
    selectedDate,
    setSelectedDate,
    filteredEvents,
    eventDates,
    currentMonthEvents,
    selectedDateEvents,
    getEventsForDay,
    goToPreviousMonth,
    goToToday,
    goToNextMonth
  } = useCalendarEvents(events, selectedEventType);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <CalendarHeader 
        eventTypes={eventTypes}
        selectedEventType={selectedEventType}
        onEventTypeChange={onEventTypeChange}
        selectedDate={selectedDate}
        goToPreviousMonth={goToPreviousMonth}
        goToToday={goToToday}
        goToNextMonth={goToNextMonth}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Calendar 
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              hasEvent: (date) => getEventsForDay(date).length > 0,
              today: (date) => isToday(date)
            }}
            modifiersClassNames={{
              hasEvent: "font-bold text-primary bg-blue-50",
              today: "ring-2 ring-blue-400"
            }}
            components={{
              DayContent: (props) => (
                <div className="relative">
                  <div>{props.date.getDate()}</div>
                  <CalendarDayContent 
                    date={props.date}
                    dayEvents={getEventsForDay(props.date)}
                    onEventClick={onEventClick}
                    onSendGift={onSendGift}
                    onToggleAutoGift={onToggleAutoGift}
                    onVerifyEvent={onVerifyEvent}
                  />
                </div>
              ),
            }}
            className="rounded-md border pointer-events-auto"
          />
        </div>
        
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
  );
};

export default EventCalendarView;
