
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
      return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
    } else if (count <= 3) {
      return (
        <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-blue-100 border-blue-300">
          {count}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-red-100 border-red-300 text-red-700">
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
        components={{
          DayContent: ({ date }) => {
            const dayEvents = getEventsForDay(date);
            const eventCount = dayEvents.length;
            
            return (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-1">
                <span className="text-sm">{date.getDate()}</span>
                
                {/* Event indicators */}
                {eventCount > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center">
                    {eventCount <= 3 ? (
                      <div className="flex space-x-1">
                        {dayEvents.slice(0, 3).map((event, index) => (
                          <div
                            key={event.id}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
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
