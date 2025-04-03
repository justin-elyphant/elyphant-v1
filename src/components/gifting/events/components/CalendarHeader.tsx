
import React from "react";
import EventTypeFilter from "../EventTypeFilter";
import CalendarNavigation from "./CalendarNavigation";
import { FilterOption } from "../types";

interface CalendarHeaderProps {
  eventTypes: string[];
  selectedEventType: FilterOption;
  onEventTypeChange: (type: FilterOption) => void;
  selectedDate: Date | undefined;
  goToPreviousMonth: () => void;
  goToToday: () => void;
  goToNextMonth: () => void;
}

const CalendarHeader = ({
  eventTypes,
  selectedEventType,
  onEventTypeChange,
  selectedDate,
  goToPreviousMonth,
  goToToday,
  goToNextMonth
}: CalendarHeaderProps) => {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-medium">Events Calendar</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Click on highlighted dates to see event details
      </p>
      
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <EventTypeFilter 
          eventTypes={eventTypes} 
          selectedType={selectedEventType}
          onTypeChange={onEventTypeChange}
        />
        
        <CalendarNavigation
          selectedDate={selectedDate}
          goToPreviousMonth={goToPreviousMonth}
          goToToday={goToToday}
          goToNextMonth={goToNextMonth}
        />
      </div>
    </div>
  );
};

export default CalendarHeader;
