
import React from "react";
import { ExtendedEventData } from "../types";
import { TooltipContent } from "@/components/ui/tooltip";
import { Calendar as CalendarIcon, Bell, DollarSign, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventPrivacyBadge from "../EventPrivacyBadge";
import { getUrgencyClass } from "../utils/dateUtils";

interface EventTooltipProps {
  events: ExtendedEventData[];
  onEventClick: (event: ExtendedEventData) => void;
  onSendGift?: (id: string) => void;
  onToggleAutoGift?: (id: string) => void;
  onVerifyEvent?: (id: string) => void;
}

const EventTooltip = ({
  events,
  onEventClick,
  onSendGift,
  onToggleAutoGift,
  onVerifyEvent
}: EventTooltipProps) => {
  // Handle send gift click
  const handleSendGift = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSendGift) {
      onSendGift(id);
    }
  };

  // Handle toggle auto-gift
  const handleToggleAutoGift = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleAutoGift) {
      onToggleAutoGift(id);
    }
  };

  // Handle verify event
  const handleVerifyEvent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVerifyEvent) {
      onVerifyEvent(id);
    }
  };

  return (
    <TooltipContent className="w-72 p-0">
      <div className="p-2 space-y-2">
        {events.map(event => (
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
  );
};

export default EventTooltip;
