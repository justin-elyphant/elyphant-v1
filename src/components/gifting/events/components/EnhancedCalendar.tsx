
import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { ExtendedEventData } from "../types";
import CalendarDayContent from "./CalendarDayContent";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EnhancedCalendarProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  getEventsForDay: (day: Date) => ExtendedEventData[];
  onEventClick: (event: ExtendedEventData) => void;
  onSendGift?: (id: string) => void;
  onToggleAutoGift?: (id: string) => void;
  onVerifyEvent?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const EnhancedCalendar = ({
  selectedDate,
  onSelectDate,
  getEventsForDay,
  onEventClick,
  onSendGift,
  onToggleAutoGift,
  onVerifyEvent,
  onEdit,
  onDelete
}: EnhancedCalendarProps) => {
  const getEventTypeColor = (eventType: string) => {
    const colors = {
      'Birthday': 'bg-pink-500',
      'Anniversary': 'bg-purple-500',
      'Wedding': 'bg-blue-500',
      'Graduation': 'bg-green-500',
      'Holiday': 'bg-red-500',
      'Work Event': 'bg-orange-500',
      'Other': 'bg-gray-500'
    };
    return colors[eventType as keyof typeof colors] || colors['Other'];
  };

  const getEventDensityIndicator = (count: number) => {
    if (count === 0) return null;
    
    if (count === 1) {
      return <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full" />;
    } else if (count <= 3) {
      return (
        <Badge variant="outline" className="text-xs px-1 py-0 h-4 sm:h-5 bg-blue-100 border-blue-300 min-h-[32px] touch-manipulation">
          {count}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-xs px-1 py-0 h-4 sm:h-5 bg-red-100 border-red-300 text-red-700 min-h-[32px] touch-manipulation">
          {count}+
        </Badge>
      );
    }
  };

  return (
    <div className="w-full">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        className="rounded-md border w-full"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm sm:text-base font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: "h-8 w-8 sm:h-7 sm:w-7 bg-transparent p-0 opacity-50 hover:opacity-100 touch-manipulation min-h-[44px] min-w-[44px]",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-8 sm:w-9 font-normal text-xs sm:text-sm",
          row: "flex w-full mt-2",
          cell: "h-16 sm:h-20 w-8 sm:w-9 text-center text-sm p-0 relative touch-manipulation",
          day: "h-16 sm:h-20 w-8 sm:w-9 p-1 font-normal aria-selected:opacity-100 touch-manipulation",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
        }}
        components={{
          DayContent: ({ date }) => {
            const dayEvents = getEventsForDay(date);
            const eventCount = dayEvents.length;
            
            return (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-0.5 sm:p-1">
                <span className="text-xs sm:text-sm">{date.getDate()}</span>
                
                {/* Event indicators */}
                {eventCount > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center px-0.5">
                    {eventCount <= 3 ? (
                      <div className="flex space-x-0.5 sm:space-x-1">
                        {dayEvents.slice(0, 3).map((event, index) => (
                          <div
                            key={event.id}
                            className={cn(
                              "w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full",
                              getEventTypeColor(event.type)
                            )}
                            title={`${event.type} - ${event.person}`}
                          />
                        ))}
                      </div>
                    ) : (
                      getEventDensityIndicator(eventCount)
                    )}
                  </div>
                )}
                
                {/* Calendar day content for interactions */}
                {eventCount > 0 && (
                  <CalendarDayContent
                    date={date}
                    dayEvents={dayEvents}
                    onEventClick={onEventClick}
                    onSendGift={onSendGift}
                    onToggleAutoGift={onToggleAutoGift}
                    onVerifyEvent={onVerifyEvent}
                  />
                )}
              </div>
            );
          }
        }}
      />
    </div>
  );
};

export default EnhancedCalendar;
