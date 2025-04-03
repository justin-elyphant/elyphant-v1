
import React from "react";
import { ExtendedEventData } from "../types";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import EventTooltip from "./EventTooltip";

interface CalendarDayContentProps {
  date: Date;
  dayEvents: ExtendedEventData[];
  onEventClick: (event: ExtendedEventData) => void;
  onSendGift?: (id: number) => void;
  onToggleAutoGift?: (id: number) => void;
  onVerifyEvent?: (id: number) => void;
}

const CalendarDayContent = ({
  date,
  dayEvents,
  onEventClick,
  onSendGift,
  onToggleAutoGift,
  onVerifyEvent
}: CalendarDayContentProps) => {
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
        <EventTooltip 
          events={dayEvents}
          onEventClick={onEventClick}
          onSendGift={onSendGift}
          onToggleAutoGift={onToggleAutoGift}
          onVerifyEvent={onVerifyEvent}
        />
      </Tooltip>
    </TooltipProvider>
  );
};

export default CalendarDayContent;
