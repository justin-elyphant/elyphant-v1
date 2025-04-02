
import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { ExtendedEventData } from "./types";

interface EventCalendarViewProps {
  events: ExtendedEventData[];
  onEventClick: (event: ExtendedEventData) => void;
}

const EventCalendarView = ({ events, onEventClick }: EventCalendarViewProps) => {
  // Convert string dates to Date objects for the calendar
  const eventDates = events.map(event => ({
    ...event,
    dateObj: parseDateString(event.date)
  }));

  // Function to parse various date formats
  function parseDateString(dateStr: string): Date | null {
    try {
      // Try to parse formatted dates like "May 15, 2023"
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
      return null;
    } catch (e) {
      console.error("Failed to parse date:", dateStr);
      return null;
    }
  }

  // Function to get events for a specific day
  const getEventsForDay = (day: Date) => {
    return eventDates.filter(event => 
      event.dateObj && 
      event.dateObj.getDate() === day.getDate() && 
      event.dateObj.getMonth() === day.getMonth() && 
      event.dateObj.getFullYear() === day.getFullYear()
    );
  };

  // Custom day rendering for calendar
  const renderDay = (day: Date) => {
    const dayEvents = getEventsForDay(day);
    
    if (dayEvents.length === 0) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative w-full h-full">
              <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1 ${dayEvents.length > 0 ? 'bg-blue-100 hover:bg-blue-200' : ''}`}
                >
                  {dayEvents.length}
                </Badge>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              {dayEvents.map(event => (
                <div 
                  key={event.id} 
                  className="text-sm cursor-pointer hover:text-blue-500"
                  onClick={() => onEventClick(event)}
                >
                  {event.person}: {event.type}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Events Calendar</h3>
        <p className="text-sm text-muted-foreground">
          Click on highlighted dates to see events
        </p>
      </div>
      
      <Calendar 
        mode="single"
        modifiers={{
          hasEvent: (date) => getEventsForDay(date).length > 0
        }}
        modifiersClassNames={{
          hasEvent: "font-bold text-primary"
        }}
        components={{
          DayContent: (props) => (
            <div className="relative">
              <div>{props.date.getDate()}</div>
              {renderDay(props.date)}
            </div>
          ),
        }}
        className="rounded-md border pointer-events-auto"
      />
    </div>
  );
};

export default EventCalendarView;
