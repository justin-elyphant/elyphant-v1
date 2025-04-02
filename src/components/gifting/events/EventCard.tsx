
import React from "react";
import { Gift, Calendar, DollarSign, Bell } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export interface EventData {
  id: number;
  type: string;
  person: string;
  date: string;
  daysAway: number;
  avatarUrl: string;
  autoGiftEnabled: boolean;
  autoGiftAmount?: number;
}

interface EventCardProps {
  event: EventData;
  onSendGift: (id: number) => void;
  onToggleAutoGift: (id: number) => void;
  extraContent?: React.ReactNode; // New prop for additional content like privacy badges
}

const EventCard = ({ event, onSendGift, onToggleAutoGift, extraContent }: EventCardProps) => {
  const { id, type, person, date, daysAway, avatarUrl, autoGiftEnabled, autoGiftAmount } = event;
  
  const getUrgencyClass = (days: number) => {
    if (days <= 7) return "text-red-600 font-semibold";
    if (days <= 14) return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={avatarUrl} alt={person} />
              <AvatarFallback>{person.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-semibold">{type}</CardTitle>
              <p className="text-sm text-muted-foreground">{person}</p>
            </div>
          </div>
          {extraContent}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
            <span>{date}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Bell className="h-4 w-4 mr-2 text-blue-500" />
            <span className={getUrgencyClass(daysAway)}>
              {daysAway === 0 
                ? "Today!" 
                : daysAway === 1 
                  ? "Tomorrow!" 
                  : `In ${daysAway} days`}
            </span>
          </div>
          
          {autoGiftEnabled && autoGiftAmount && (
            <div className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 mr-2 text-green-500" />
              <span>Auto-gift: ${autoGiftAmount}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 justify-between">
        <Button variant="outline" size="sm" onClick={() => onSendGift(id)}>
          <Gift className="h-4 w-4 mr-2" />
          Send Gift
        </Button>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Auto</span>
          <Switch 
            checked={autoGiftEnabled} 
            onCheckedChange={() => onToggleAutoGift(id)}
            className="scale-75"
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
