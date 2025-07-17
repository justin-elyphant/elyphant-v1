
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Calendar, Edit, CheckCircle, DollarSign, Bell, Clock, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ExtendedEventData } from "../types";
import EventPrivacyBadge from "../EventPrivacyBadge";

interface EnhancedEventCardProps {
  event: ExtendedEventData;
  onSendGift: () => void;
  onToggleAutoGift: () => void;
  onEdit: () => void;
  onVerifyEvent: () => void;
  onArchive?: () => void;
  onClick?: () => void;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  showSelection?: boolean;
}

const EnhancedEventCard = ({
  event,
  onSendGift,
  onToggleAutoGift,
  onEdit,
  onVerifyEvent,
  onArchive,
  onClick,
  isSelected = false,
  onSelectionChange,
  showSelection = false,
}: EnhancedEventCardProps) => {
  const handleCardClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('button') === null &&
      (e.target as HTMLElement).closest('[role="checkbox"]') === null &&
      onClick
    ) {
      onClick();
    }
  };

  const getUrgencyColor = (daysAway: number) => {
    if (daysAway <= 3) return "text-red-600 bg-red-50";
    if (daysAway <= 7) return "text-orange-600 bg-orange-50";
    if (daysAway <= 14) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <Card 
      className={`relative h-full transition-all hover:shadow-md border ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3 relative">
        {/* Auto-Gift Status - Upper Right Corner */}
        {event.autoGiftEnabled && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              <Gift className="h-3 w-3 mr-1" />
              Auto-Gift
            </Badge>
          </div>
        )}
        
        <div className="flex justify-between items-start pr-20">
          <div className="flex items-center space-x-3 flex-1">
            {showSelection && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelectionChange}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <Avatar className="h-10 w-10">
              <AvatarImage src={event.avatarUrl} alt={event.person} />
              <AvatarFallback className="text-sm">{event.person[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base truncate">{event.person}</div>
              <div className="text-sm text-muted-foreground capitalize">{event.type}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <EventPrivacyBadge privacyLevel={event.privacyLevel} isVerified={event.isVerified} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 space-y-4">
        {/* Date and Urgency */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{event.date}</span>
          </div>
          <Badge 
            variant="outline" 
            className={`${getUrgencyColor(event.daysAway)} border-0`}
          >
            <Clock className="h-3 w-3 mr-1" />
            {event.daysAway} days away
          </Badge>
        </div>

        {/* Auto-Gift Configuration */}
        {event.autoGiftEnabled && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Gift className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Auto-Gift Settings</span>
              </div>
              <Switch
                checked={event.autoGiftEnabled || false}
                onCheckedChange={onToggleAutoGift}
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Budget:</span>
                <span className="font-medium flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {event.autoGiftAmount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Source:</span>
                <span className="font-medium capitalize">{event.giftSource || 'wishlist'}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-Gift Toggle for Disabled */}
        {!event.autoGiftEnabled && (
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Gift className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Auto-Gift</span>
              </div>
              <Switch
                checked={false}
                onCheckedChange={onToggleAutoGift}
              />
            </div>
          </div>
        )}
        
        {/* Verification Status */}
        {event.needsVerification && !event.isVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700 font-medium">Needs verification</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-100" 
                onClick={(e) => {
                  e.stopPropagation();
                  onVerifyEvent();
                }}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Verify
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex space-x-2 w-full">
          <Button 
            className="flex-1" 
            variant="default" 
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
            variant="outline" 
            size="sm" 
            className="px-3"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {onArchive && (
            <Button 
              variant="outline" 
              size="sm" 
              className="px-3"
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
            >
              <Archive className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default EnhancedEventCard;
