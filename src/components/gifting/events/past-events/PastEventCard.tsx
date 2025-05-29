
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gift, CheckCircle, RotateCcw } from "lucide-react";
import { ExtendedEventData } from "../types";
import { Button } from "@/components/ui/button";

interface PastEventCardProps {
  event: ExtendedEventData;
}

const PastEventCard = ({ event }: PastEventCardProps) => {
  const giftSent = Math.random() > 0.3; // Mock data for gift sent status
  const giftAmount = giftSent ? Math.floor(Math.random() * 100) + 25 : 0;
  
  const handleCreateRecurring = () => {
    // TODO: Implement recurring event creation
    console.log("Creating recurring event for:", event.id);
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={event.avatarUrl} alt={event.person} />
            <AvatarFallback>{event.person[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold text-base">{event.person}</div>
            <div className="text-sm text-muted-foreground capitalize">{event.type}</div>
          </div>
          {giftSent && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Gift Sent
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{event.date}</span>
        </div>

        {giftSent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Gift className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Gift Sent</span>
            </div>
            <div className="text-sm text-green-600">
              Amount: ${giftAmount}
            </div>
            <div className="text-xs text-green-500 mt-1">
              {event.autoGiftEnabled ? "Auto-gifted" : "Manual gift"}
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-sm text-orange-700">
              No gift sent for this event
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateRecurring}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Create Recurring Event
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PastEventCard;
