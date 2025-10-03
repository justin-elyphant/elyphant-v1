
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Gift, 
  Settings, 
  Trash2, 
  CheckCircle,
  Heart,
  Users,
  User
} from "lucide-react";
import { ExtendedEventData } from "./types";

interface EventCardProps {
  event: ExtendedEventData;
  onSendGift: () => void;
  onToggleAutoGift: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onVerifyEvent: () => void;
  onClick?: () => void;
}

const EventCard = ({
  event,
  onSendGift,
  onToggleAutoGift,
  onEdit,
  onDelete,
  onVerifyEvent,
  onClick,
}: EventCardProps) => {
  const isUrgent = event.daysAway <= 7;
  const isToday = event.daysAway === 0;
  
  // Get appropriate icon based on event category
  const getCategoryIcon = () => {
    if (event.eventCategory === 'self') return <User className="h-4 w-4" />;
    if (event.eventCategory === 'shared') return <Heart className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  // Get category color
  const getCategoryColor = () => {
    if (event.eventCategory === 'self') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (event.eventCategory === 'shared') return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getActionButtons = () => {
    // For user's own events (self), show sharing and privacy controls
    if (event.eventCategory === 'self') {
      return (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Settings className="mr-1 h-3 w-3" />
            Share Settings
          </Button>
        </>
      );
    }

    // For others' events, show auto-gift controls
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSendGift();
          }}
        >
          <Gift className="mr-1 h-3 w-3" />
          Browse Gifts
        </Button>
        <Button
          variant={event.autoGiftEnabled ? "default" : "outline"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleAutoGift();
          }}
        >
          {event.autoGiftEnabled ? "Auto-Gift On" : "Schedule Gift"}
        </Button>
      </>
    );
  };

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
        isUrgent ? 'border-orange-200 bg-orange-50' : 'hover:border-primary/20'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={event.avatarUrl} alt={event.person} />
              <AvatarFallback>
                {event.person?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-base leading-none">
                {event.person}'s {event.type}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{event.date}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <Badge className={`text-xs ${getCategoryColor()}`}>
              <span className="mr-1">{getCategoryIcon()}</span>
              {event.eventCategory === 'self' ? 'My Event' : 
               event.eventCategory === 'shared' ? 'Shared' : 'Gift To Send'}
            </Badge>
            
            {isToday && (
              <Badge variant="destructive" className="text-xs">
                Today!
              </Badge>
            )}
            {isUrgent && !isToday && (
              <Badge variant="secondary" className="text-xs">
                {event.daysAway} days away
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {getActionButtons()}
          </div>

          <div className="flex space-x-1">
            {event.needsVerification && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onVerifyEvent();
                }}
              >
                <CheckCircle className="h-4 w-4 text-orange-500" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {event.autoGiftEnabled && event.eventCategory !== 'self' && (
          <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-800">
              Auto-gifting enabled • Budget: ${event.autoGiftAmount || 0}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;
