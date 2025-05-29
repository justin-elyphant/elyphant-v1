
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Gift, Settings, MoreVertical, Repeat, Clock } from "lucide-react";
import { ExtendedEventData } from "./types";
import EventPrivacyBadge from "./EventPrivacyBadge";

interface EventCardProps {
  event: ExtendedEventData;
  onSendGift: () => void;
  onToggleAutoGift: () => void;
  onEdit: () => void;
  onVerifyEvent: () => void;
  onClick?: () => void;
}

const EventCard = ({ 
  event, 
  onSendGift, 
  onToggleAutoGift, 
  onEdit, 
  onVerifyEvent,
  onClick 
}: EventCardProps) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons or dropdowns
    if ((e.target as Element).closest('button, [role="menuitem"]')) {
      return;
    }
    onClick?.();
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={event.avatarUrl} alt={event.person} />
              <AvatarFallback>{event.person.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{event.person}</h3>
                {event.isRecurring && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs">
                    <Repeat className="h-3 w-3 mr-1" />
                    {event.recurringType === 'yearly' ? 'Yearly' : 'Monthly'}
                  </Badge>
                )}
                <EventPrivacyBadge privacyLevel={event.privacyLevel} />
              </div>
              <p className="text-sm text-muted-foreground">{event.type}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Event
              </DropdownMenuItem>
              {event.needsVerification && (
                <DropdownMenuItem onClick={onVerifyEvent}>
                  Verify Event
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{event.date}</span>
            {event.daysAway <= 7 && event.daysAway >= 0 && (
              <>
                <span>•</span>
                <span className="text-orange-600 dark:text-orange-400 font-medium flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {event.daysAway === 0 ? 'Today' : 
                   event.daysAway === 1 ? 'Tomorrow' : 
                   `${event.daysAway} days`}
                </span>
              </>
            )}
          </div>
        </div>

        {event.autoGiftEnabled && (
          <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
            <div className="flex items-center text-sm text-green-700 dark:text-green-300">
              <Gift className="h-4 w-4 mr-2" />
              Auto-Gift enabled: ${event.autoGiftAmount}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onSendGift();
            }}
          >
            <Gift className="h-4 w-4 mr-2" />
            Send Gift
          </Button>
          
          <Button 
            size="sm" 
            variant={event.autoGiftEnabled ? "outline" : "default"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleAutoGift();
            }}
          >
            {event.autoGiftEnabled ? "Manage" : "Auto-Gift"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
