
import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Calendar as CalendarIcon, Gift, Bell, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtendedEventData } from "./types";
import EventPrivacyBadge from "./EventPrivacyBadge";

interface EventCalendarViewProps {
  events: ExtendedEventData[];
  onEventClick: (event: ExtendedEventData) => void;
  onSendGift?: (id: number) => void;
  onToggleAutoGift?: (id: number) => void;
  onVerifyEvent?: (id: number) => void;
}

const EventCalendarView = ({ 
  events, 
  onEventClick, 
  onSendGift,
  onToggleAutoGift,
  onVerifyEvent
}: EventCalendarViewProps) => {
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Events Calendar</h3>
        <p className="text-sm text-muted-foreground">
          Click on highlighted dates to see event details
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
