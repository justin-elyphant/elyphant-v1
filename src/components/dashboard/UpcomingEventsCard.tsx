import React from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-500" />
              Upcoming Gift Occasions
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Plan and manage your upcoming gifts and events.
            </CardDescription>
          </div>
          <Link to="/events" className="text-sm text-purple-600 hover:underline flex items-center whitespace-nowrap">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  {event.eventType === "Birthday" ? (
                    <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{event.person}</h4>
                    {event.isShared && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs">
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
                        <span className="text-green-600 dark:text-green-400 font-medium">
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
