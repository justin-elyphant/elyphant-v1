
import { useState, useMemo } from "react";
import { ExtendedEventData, FilterOption } from "../types";
import { parseDateString } from "../utils/dateUtils";

export const useCalendarEvents = (events: ExtendedEventData[], selectedEventType: FilterOption) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Navigate to today's date
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setSelectedDate(newDate);
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setSelectedDate(newDate);
    }
  };
  
  // Filter events based on selected type
  const filteredEvents = selectedEventType === "all" 
    ? events 
    : events.filter(event => event.type === selectedEventType);

  // Parse dates more effectively
  const eventDates = useMemo(() => {
    return filteredEvents.map(event => ({
      ...event,
      dateObj: parseDateString(event.date)
    }));
  }, [filteredEvents]);

  // Function to get events for a specific day
  const getEventsForDay = (day: Date) => {
    return eventDates.filter(event => 
      event.dateObj && 
      event.dateObj.getDate() === day.getDate() && 
      event.dateObj.getMonth() === day.getMonth() && 
      event.dateObj.getFullYear() === day.getFullYear()
    );
  };

  // Get events for the currently selected date
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  // Get all events for the current month
  const currentMonthEvents = useMemo(() => {
    if (!selectedDate) return [];
    
    return eventDates
      .filter(event => 
        event.dateObj && 
        event.dateObj.getMonth() === selectedDate.getMonth() &&
        event.dateObj.getFullYear() === selectedDate.getFullYear()
      )
      .sort((a, b) => {
        if (!a.dateObj || !b.dateObj) return 0;
        return a.dateObj.getTime() - b.dateObj.getTime();
      });
  }, [eventDates, selectedDate]);

  return {
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
  };
};
