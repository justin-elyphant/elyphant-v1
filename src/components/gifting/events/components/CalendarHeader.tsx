
import React from "react";
import EventTypeFilter from "../EventTypeFilter";
import CalendarNavigation from "./CalendarNavigation";

interface CalendarHeaderProps {
  eventTypes: string[];
  selectedEventType: string;
  onEventTypeChange: (type: string) => void;
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
      <h3 className="text-base sm:text-lg font-medium">Events Calendar</h3>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4">
        Click on highlighted dates to see event details
      </p>
      
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
        <div className="w-full lg:w-auto">
          <EventTypeFilter 
            eventTypes={eventTypes} 
            selectedType={selectedEventType}
            onTypeChange={onEventTypeChange}
          />
        </div>
        
        <div className="w-full lg:w-auto flex justify-center lg:justify-end">
          <CalendarNavigation
            selectedDate={selectedDate}
            goToPreviousMonth={goToPreviousMonth}
            goToToday={goToToday}
            goToNextMonth={goToNextMonth}
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
