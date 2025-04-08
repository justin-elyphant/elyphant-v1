
import React from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, addDays } from "date-fns";

// Mock data for upcoming events
const upcomingEvents = [
  {
    id: 1,
    person: "Alex Johnson",
    eventType: "Birthday",
    date: addDays(new Date(), 14),
    isShared: true,
    autoGift: true,
    giftAmount: 75
  },
  {
    id: 2,
    person: "Jamie Smith",
    eventType: "Anniversary",
    date: addDays(new Date(), 30),
    isShared: false,
    autoGift: false
  },
  {
    id: 3,
    person: "Taylor Wilson",
    eventType: "Graduation",
    date: addDays(new Date(), 45),
    isShared: true,
    autoGift: true,
    giftAmount: 100
  }
];

const UpcomingEventsCard = () => {
  return (
    <Card className="border-2 border-purple-100 h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-500" />
            Upcoming Gift Occasions
          </CardTitle>
          <Link to="/events" className="text-sm text-purple-600 hover:underline flex items-center">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  {event.eventType === "Birthday" ? (
                    <Gift className="h-5 w-5 text-purple-600" />
                  ) : (
                    <Calendar className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{event.person}</h4>
                    {event.isShared && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                        Shared
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{event.eventType}</span>
                    <span>•</span>
                    <span>{format(event.date, 'MMM d, yyyy')}</span>
                    
                    {event.autoGift && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 font-medium">
                          Auto-Gift: ${event.giftAmount}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <Button size="sm" variant={event.autoGift ? "outline" : "default"}>
                {event.autoGift ? "Edit" : "Send Gift"}
              </Button>
            </div>
          ))}
          
          <Button variant="outline" className="w-full border-dashed" asChild>
            <Link to="/events?action=add">
              <Gift className="h-4 w-4 mr-2" />
              Add New Event
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingEventsCard;
