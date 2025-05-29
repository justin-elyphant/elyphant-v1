
import React from "react";
import { ExtendedEventData } from "../types";
import { TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, getUrgencyClass } from "../utils/dateUtils";
import EventQuickActions from "./EventQuickActions";
import { Gift, Calendar, User } from "lucide-react";

interface EnhancedEventTooltipProps {
  events: ExtendedEventData[];
  onEventClick: (event: ExtendedEventData) => void;
  onSendGift?: (id: string) => void;
  onToggleAutoGift?: (id: string) => void;
  onVerifyEvent?: (id: string) => void;
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

const EnhancedEventTooltip = ({
  events,
  onEventClick,
  onSendGift,
  onToggleAutoGift,
  onVerifyEvent,
  onEdit,
  onDelete
}: EnhancedEventTooltipProps) => {
  if (events.length === 0) return null;

  return (
    <TooltipContent side="right" className="max-w-sm p-0">
      <div className="p-3">
        <div className="font-medium mb-2">
          {events.length === 1 ? 'Event' : `${events.length} Events`}
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {events.map((event) => (
            <div
              key={event.id}
              className="border rounded-lg p-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onEventClick(event)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <User className="h-3 w-3 text-gray-500" />
                    <span className="font-medium text-sm">{event.person}</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {formatEventDate(event.dateObj || null)}
                    </span>
                  </div>
                </div>
                <EventQuickActions
                  event={event}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSendGift={onSendGift}
                  onToggleAutoGift={onToggleAutoGift}
                  onVerifyEvent={onVerifyEvent}
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
                <div className="flex items-center space-x-1 text-xs text-green-600">
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
    </TooltipContent>
  );
};

export default EnhancedEventTooltip;
