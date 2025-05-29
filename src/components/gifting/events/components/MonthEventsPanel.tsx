
import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ExtendedEventData } from "../types";
import { Gift, Calendar } from "lucide-react";
import { formatEventDate, getUrgencyClass } from "../utils/dateUtils";
import EventQuickActions from "./EventQuickActions";
import { Badge } from "@/components/ui/badge";

interface MonthEventsPanelProps {
  selectedDate: Date | undefined;
  currentMonthEvents: ExtendedEventData[];
  selectedDateEvents: ExtendedEventData[];
  onEventClick: (event: ExtendedEventData) => void;
  onSendGift?: (id: string) => void;
  onToggleAutoGift?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const getEventTypeColor = (eventType: string) => {
  const colors = {
    'Birthday': 'bg-pink-100 text-pink-800 border-pink-200',
    'Anniversary': 'bg-purple-100 text-purple-800 border-purple-200',
    'Wedding': 'bg-blue-100 text-blue-800 border-blue-200',
    'Graduation': 'bg-green-100 text-green-800 border-green-200',
    'Holiday': 'bg-red-100 text-red-800 border-red-200',
    'Work Event': 'bg-orange-100 text-orange-800 border-orange-200',
    'Other': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colors[eventType as keyof typeof colors] || colors['Other'];
};

const MonthEventsPanel = ({
  selectedDate,
  currentMonthEvents,
  selectedDateEvents,
  onEventClick,
  onSendGift,
  onToggleAutoGift,
  onEdit,
  onDelete
}: MonthEventsPanelProps) => {
  return (
    <div className="border rounded-md p-4 bg-white">
      <h3 className="font-medium mb-2">
        {selectedDate ? format(selectedDate, "MMMM yyyy") : "Event Summary"}
      </h3>
      
      {currentMonthEvents.length > 0 ? (
        <div className="space-y-3 mt-4">
          <h4 className="text-sm font-medium">Upcoming Events This Month</h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {currentMonthEvents.map(event => (
              <div 
                key={event.id}
                className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onEventClick(event)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{event.person}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {formatEventDate(event.dateObj || null)}
                    </div>
                  </div>
                  <EventQuickActions
                    event={event}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSendGift={onSendGift}
                    onToggleAutoGift={onToggleAutoGift}
                    compact
                  />
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getEventTypeColor(event.type)}`}
                  >
                    {event.type}
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getUrgencyClass(event.daysAway)}`}
                  >
                    {event.daysAway === 0 
                      ? "Today!" 
                      : event.daysAway === 1 
                        ? "Tomorrow!" 
                        : `In ${event.daysAway} days`}
                  </Badge>
                </div>
                
                {event.autoGiftEnabled && (
                  <div className="text-xs text-green-600 flex items-center space-x-1">
                    <Gift className="h-3 w-3" />
                    <span>
                      Auto-gift {event.autoGiftAmount ? `$${event.autoGiftAmount}` : "enabled"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No events scheduled this month</p>
        </div>
      )}
      
      {selectedDateEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">
            Events on {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "selected date"}
          </h4>
          <div className="space-y-2">
            {selectedDateEvents.map(event => (
              <div 
                key={event.id}
                className="p-3 border rounded-md bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                onClick={() => onEventClick(event)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{event.person} - {event.type}</div>
                  </div>
                  <EventQuickActions
                    event={event}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSendGift={onSendGift}
                    onToggleAutoGift={onToggleAutoGift}
                    compact
                  />
                </div>
                
                {event.autoGiftEnabled ? (
                  <div className="text-xs text-green-600 flex items-center space-x-1">
                    <Gift className="h-3 w-3" />
                    <span>
                      Auto-gift {event.autoGiftAmount ? `$${event.autoGiftAmount}` : "enabled"}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Auto-gift disabled
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthEventsPanel;
