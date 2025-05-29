
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, Settings, MoreVertical } from "lucide-react";
import { ExtendedEventData } from "../types";

interface AccessibleEventCardProps {
  event: ExtendedEventData;
  isSelected?: boolean;
  onSendGift: () => void;
  onToggleAutoGift: () => void;
  onEdit: () => void;
  onVerifyEvent: () => void;
  onClick?: () => void;
}

const AccessibleEventCard = ({ 
  event, 
  isSelected, 
  onSendGift, 
  onToggleAutoGift, 
  onEdit, 
  onVerifyEvent, 
  onClick 
}: AccessibleEventCardProps) => {
  const urgencyLevel = event.daysAway <= 7 ? "urgent" : event.daysAway <= 30 ? "soon" : "normal";
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        isSelected 
          ? "ring-2 ring-primary ring-offset-2" 
          : "hover:shadow-md"
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${event.person}'s ${event.type} on ${event.date}, ${event.daysAway} days away`}
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={event.avatarUrl} alt={`${event.person}'s avatar`} />
            <AvatarFallback aria-label={`${event.person} initials`}>
              {event.person[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold text-base">{event.person}</div>
            <div className="text-sm text-muted-foreground capitalize">{event.type}</div>
          </div>
          {event.needsVerification && (
            <Badge variant="outline" aria-label="Needs verification">
              Verify
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div 
          className="flex items-center space-x-2 text-sm"
          aria-label={`Event date: ${event.date}`}
        >
          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span>{event.date}</span>
          <span 
            className={`font-medium ${
              urgencyLevel === "urgent" ? "text-red-600" : 
              urgencyLevel === "soon" ? "text-yellow-600" : 
              "text-muted-foreground"
            }`}
            aria-label={`${event.daysAway} days until event`}
          >
            ({event.daysAway} days)
          </span>
        </div>

        {event.autoGiftEnabled && (
          <div 
            className="bg-green-50 border border-green-200 rounded-lg p-3"
            role="status"
            aria-label="Auto-gifting enabled"
          >
            <div className="flex items-center space-x-2 mb-1">
              <Gift className="h-4 w-4 text-green-600" aria-hidden="true" />
              <span className="text-sm font-medium text-green-700">Auto-gift enabled</span>
            </div>
            <div className="text-sm text-green-600">
              Budget: ${event.autoGiftAmount || 0}
            </div>
          </div>
        )}

        <div className="flex space-x-2" role="group" aria-label="Event actions">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onSendGift();
            }}
            className="flex-1"
            aria-label={`Send gift to ${event.person}`}
          >
            <Gift className="h-4 w-4 mr-1" aria-hidden="true" />
            Send Gift
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label={`Edit ${event.person}'s ${event.type} event`}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessibleEventCard;
