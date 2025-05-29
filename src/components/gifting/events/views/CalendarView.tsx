
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Event Type Filter */}
            <select
              value={selectedEventType}
              onChange={(e) => onEventTypeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Events</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-sm text-gray-500">
                {day}
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
                    p-2 min-h-[80px] border border-gray-200 rounded-md
                    ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}
                    ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}
                  `}
                >
                  <div className="text-sm font-medium text-center mb-1">
                    {format(day, 'd')}
                  </div>
                  
                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200"
                        onClick={() => onEventClick(event)}
                      >
                        {event.person}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
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
              <h3 className="text-lg font-medium mb-4">All Events This Month</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
