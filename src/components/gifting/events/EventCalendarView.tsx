
import React, { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Calendar as CalendarIcon, Gift, Bell, DollarSign, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtendedEventData, FilterOption } from "./types";
import EventPrivacyBadge from "./EventPrivacyBadge";
import EventTypeFilter from "./EventTypeFilter";
import { format, isToday } from "date-fns";

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

  // Function to parse various date formats
  function parseDateString(dateStr: string): Date | null {
    try {
      // Handle formats like "May 15, 2023"
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
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

  // Function to determine urgency class for dates
  const getUrgencyClass = (days: number) => {
    if (days <= 7) return "text-red-600 font-semibold";
    if (days <= 14) return "text-amber-600";
    return "text-muted-foreground";
  };

  // Handle send gift click
  const handleSendGift = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSendGift) {
      onSendGift(id);
    }
  };

  // Handle toggle auto-gift
  const handleToggleAutoGift = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleAutoGift) {
      onToggleAutoGift(id);
    }
  };

  // Handle verify event
  const handleVerifyEvent = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVerifyEvent) {
      onVerifyEvent(id);
    }
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
          <TooltipContent className="w-72 p-0">
            <div className="p-2 space-y-2">
              {dayEvents.map(event => (
                <div 
                  key={event.id} 
                  className="p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="font-medium">{event.type} - {event.person}</span>
                    </div>
                    {event.privacyLevel && (
                      <EventPrivacyBadge 
                        privacyLevel={event.privacyLevel} 
                        isVerified={event.isVerified} 
                        small
                      />
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm mb-1">
                    <Bell className="h-3 w-3 mr-2 text-blue-500" />
                    <span className={getUrgencyClass(event.daysAway)}>
                      {event.daysAway === 0 
                        ? "Today!" 
                        : event.daysAway === 1 
                          ? "Tomorrow!" 
                          : `In ${event.daysAway} days`}
                    </span>
                  </div>
                  
                  {event.autoGiftEnabled && event.autoGiftAmount && (
                    <div className="flex items-center text-sm mb-2">
                      <DollarSign className="h-3 w-3 mr-2 text-green-500" />
                      <span>Auto-gift: ${event.autoGiftAmount}</span>
                      {event.giftSource && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({event.giftSource === "wishlist" 
                            ? "From wishlist" 
                            : event.giftSource === "ai" 
                              ? "AI selected" 
                              : "Wishlist + AI"})
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2">
                    {onSendGift && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={(e) => handleSendGift(event.id, e)}
                      >
                        <Gift className="h-3 w-3 mr-1" />
                        Send Gift
                      </Button>
                    )}
                    
                    {event.needsVerification && onVerifyEvent && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs border-amber-300"
                        onClick={(e) => handleVerifyEvent(event.id, e)}
                      >
                        Verify
                      </Button>
                    )}
                    
                    {onToggleAutoGift && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={(e) => handleToggleAutoGift(event.id, e)}
                      >
                        {event.autoGiftEnabled ? 'Auto: On' : 'Auto: Off'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Format date for display
  const formatEventDate = (date: Date | null) => {
    if (!date) return "";
    return format(date, "MMMM d, yyyy");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
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
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPreviousMonth}
              title="Previous month"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToToday}
              className={isToday(selectedDate as Date) ? "bg-blue-100 border-blue-300" : ""}
              title="Go to today"
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextMonth}
              title="Next month"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
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
                  {renderDay(props.date)}
                </div>
              ),
            }}
            className="rounded-md border pointer-events-auto"
          />
        </div>
        
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">
            {selectedDate ? format(selectedDate, "MMMM yyyy") : "Event Summary"}
          </h3>
          
          {currentMonthEvents.length > 0 ? (
            <div className="space-y-3 mt-4">
              <h4 className="text-sm font-medium">Upcoming Events This Month</h4>
              {currentMonthEvents.map(event => (
                <div 
                  key={event.id}
                  className="p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{event.person}</span>
                    <span className="text-xs text-muted-foreground">
                      {event.dateObj ? formatEventDate(event.dateObj) : event.date}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm">{event.type}</span>
                    <span className={`text-xs ${getUrgencyClass(event.daysAway)}`}>
                      {event.daysAway === 0 
                        ? "Today!" 
                        : event.daysAway === 1 
                          ? "Tomorrow!" 
                          : `In ${event.daysAway} days`}
                    </span>
                  </div>
                  
                  {event.autoGiftEnabled && (
                    <div className="mt-1 text-xs text-green-600">
                      Auto-gift {event.autoGiftAmount ? `$${event.autoGiftAmount}` : "enabled"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No events scheduled this month
            </div>
          )}
          
          {selectedDateEvents.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">
                Events on {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "selected date"}
              </h4>
              {selectedDateEvents.map(event => (
                <div 
                  key={event.id}
                  className="p-2 border rounded-md bg-blue-50 mb-2 cursor-pointer"
                  onClick={() => onEventClick(event)}
                >
                  <div className="font-medium">{event.person} - {event.type}</div>
                  {event.autoGiftEnabled ? (
                    <div className="text-xs text-green-600 mt-1">
                      Auto-gift {event.autoGiftAmount ? `$${event.autoGiftAmount}` : "enabled"}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground mt-1">
                      Auto-gift disabled
                    </div>
                  )}
                  
                  <div className="flex mt-2">
                    {onSendGift && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-6 text-xs mr-2"
                        onClick={(e) => handleSendGift(event.id, e)}
                      >
                        <Gift className="h-3 w-3 mr-1" />
                        Send Gift
                      </Button>
                    )}
                    
                    {onToggleAutoGift && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={(e) => handleToggleAutoGift(event.id, e)}
                      >
                        Auto: {event.autoGiftEnabled ? 'On' : 'Off'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCalendarView;
