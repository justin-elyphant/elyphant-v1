
import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ExtendedEventData } from "../types";
import { Gift } from "lucide-react";
import { formatEventDate, getUrgencyClass } from "../utils/dateUtils";

interface MonthEventsPanelProps {
  selectedDate: Date | undefined;
  currentMonthEvents: ExtendedEventData[];
  selectedDateEvents: ExtendedEventData[];
  onEventClick: (event: ExtendedEventData) => void;
  onSendGift?: (id: number) => void;
  onToggleAutoGift?: (id: number) => void;
}

const MonthEventsPanel = ({
  selectedDate,
  currentMonthEvents,
  selectedDateEvents,
  onEventClick,
  onSendGift,
  onToggleAutoGift
}: MonthEventsPanelProps) => {
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

  return (
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
  );
};

export default MonthEventsPanel;
