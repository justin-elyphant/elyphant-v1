
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Calendar, Edit, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  onClick,
}: EventCardProps) => {
  // To prevent event bubbling from buttons to card
  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger if click happened directly on card or card content elements
    if (
      (e.target as HTMLElement).closest('button') === null &&
      onClick
    ) {
      onClick();
    }
  };

  return (
    <Card 
      className="relative h-full cursor-pointer transition-all hover:shadow-md" 
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={event.avatarUrl} alt={event.person} />
              <AvatarFallback>{event.person[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{event.person}</div>
              <div className="text-sm text-muted-foreground">{event.type}</div>
            </div>
          </div>
          <EventPrivacyBadge privacyLevel={event.privacyLevel} isVerified={event.isVerified} />
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{event.date}</span>
          <Badge variant="outline" className="ml-auto">
            {event.daysAway} days away
          </Badge>
        </div>
        
        {/* Auto-Gift Status */}
        <div className="flex items-center justify-between mt-3">
          <div className="text-sm">
            <span>Auto-Gift: </span>
            {event.autoGiftEnabled ? (
              <span className="font-medium text-green-600">
                ${event.autoGiftAmount || 0}
              </span>
            ) : (
              <span className="text-muted-foreground">Disabled</span>
            )}
          </div>
          <Switch
            checked={event.autoGiftEnabled || false}
            onCheckedChange={onToggleAutoGift}
            aria-label="Toggle auto-gift"
          />
        </div>
        
        {/* Verification indicator */}
        {event.needsVerification && !event.isVerified && (
          <div className="mt-3 rounded-sm bg-amber-50 p-2 text-xs text-amber-600 flex items-center space-x-1">
            <span>Needs verification</span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2 text-xs text-amber-700" 
              onClick={(e) => {
                e.stopPropagation();
                onVerifyEvent();
              }}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Verify
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex space-x-2 w-full">
          <Button 
            className="flex-1" 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSendGift();
            }}
          >
            <Gift className="h-4 w-4 mr-2" />
            Send Gift
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-2"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
