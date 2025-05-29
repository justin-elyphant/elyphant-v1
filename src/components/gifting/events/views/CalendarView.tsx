
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { ExtendedEventData } from "../types";
import EventCard from "../EventCard";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";

interface CalendarViewProps {
  events: ExtendedEventData[];
  onEventClick: (event: ExtendedEventData) => void;
  onSendGift: (id: string) => void;
  onToggleAutoGift: (id: string) => void;
  onEdit: (id: string) => void;
  onVerifyEvent: (id: string) => void;
  onDelete: (id: string) => void;
  eventTypes: string[];
  selectedEventType: string;
  onEventTypeChange: (type: string) => void;
}

const CalendarView = ({
  events,
  onEventClick,
  onSendGift,
  onToggleAutoGift,
  onEdit,
  onVerifyEvent,
  onDelete,
  eventTypes,
  selectedEventType,
  onEventTypeChange,
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (selectedEventType === "all") return true;
      return event.type === selectedEventType;
    });
  }, [events, selectedEventType]);

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(event => {
      if (!event.dateObj) return false;
      return isSameDay(event.dateObj, day);
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
                className="min-h-[44px] min-w-[44px] touch-manipulation"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="flex items-center text-lg sm:text-2xl">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="truncate">{format(currentDate, "MMMM yyyy")}</span>
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
                className="min-h-[44px] min-w-[44px] touch-manipulation"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Event Type Filter */}
            <select
              value={selectedEventType}
              onChange={(e) => onEventTypeChange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[44px] touch-manipulation"
            >
              <option value="all">All Events</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-6">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
            {/* Day headers */}
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={index} className="p-1 sm:p-2 text-center font-medium text-xs sm:text-sm text-gray-500">
                <span className="hidden sm:inline">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}
                </span>
                <span className="sm:hidden">{day}</span>
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map(day => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    p-1 sm:p-2 min-h-[60px] sm:min-h-[80px] border border-gray-200 rounded-md touch-manipulation
                    ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}
                    ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}
                  `}
                >
                  <div className="text-xs sm:text-sm font-medium text-center mb-1">
                    {format(day, 'd')}
                  </div>
                  
                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 touch-manipulation min-h-[32px] flex items-center justify-center"
                        onClick={() => onEventClick(event)}
                      >
                        <span className="truncate">{event.person}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 text-center touch-manipulation min-h-[32px] flex items-center justify-center">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Events list for selected day */}
          {filteredEvents.length > 0 && (
            <div className="mt-6">
              <h3 className="text-base sm:text-lg font-medium mb-4">All Events This Month</h3>
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {filteredEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onSendGift={() => onSendGift(event.id)}
                    onToggleAutoGift={() => onToggleAutoGift(event.id)}
                    onEdit={() => onEdit(event.id)}
                    onDelete={() => onDelete(event.id)}
                    onVerifyEvent={() => onVerifyEvent(event.id)}
                    onClick={() => onEventClick(event)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
