
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Gift, CreditCard, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
}

const EventCard = ({ event, onSendGift, onToggleAutoGift }: EventCardProps) => {
  const isSoon = event.daysAway <= 14;

  return (
    <Card key={event.id} className={isSoon ? "border-red-200" : ""}>
      <CardHeader className={isSoon ? "bg-red-50" : ""}>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={event.avatarUrl} alt={event.person} />
              <AvatarFallback>{event.person.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{event.type}</CardTitle>
              <CardDescription>{event.person}</CardDescription>
            </div>
          </div>
          {isSoon && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Soon!</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{event.date} ({event.daysAway} days away)</span>
        </div>
        
        {event.autoGiftEnabled ? (
          <div className="bg-green-50 border border-green-100 rounded-md p-3">
            <div className="flex items-start">
              <CreditCard className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Auto-Gift Enabled</p>
                <p className="text-xs text-green-700">
                  ${event.autoGiftAmount} will be charged on {event.date}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-md p-3">
            <div className="flex items-start">
              <Bell className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Reminder Only</p>
                <p className="text-xs text-gray-500">
                  You'll receive a notification 1 week before
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" size="sm" onClick={() => onSendGift(event.id)}>
          <Gift className="mr-2 h-3 w-3" />
          Send Gift Now
        </Button>
        {event.autoGiftEnabled ? (
          <Button variant="ghost" size="sm" onClick={() => onToggleAutoGift(event.id)}>
            Edit Auto-Gift
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => onToggleAutoGift(event.id)}>
            <CreditCard className="mr-2 h-3 w-3" />
            Enable Auto-Gift
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EventCard;
