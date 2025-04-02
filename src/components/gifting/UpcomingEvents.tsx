
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Gift, Plus, CreditCard, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock data for upcoming events
const upcomingEvents = [
  {
    id: 1,
    type: "Birthday",
    person: "Alex Johnson",
    date: "May 15, 2023",
    daysAway: 14,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: true,
    autoGiftAmount: 75
  },
  {
    id: 2,
    type: "Anniversary",
    person: "Jamie Smith",
    date: "June 22, 2023",
    daysAway: 30,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: false
  },
  {
    id: 3,
    type: "Christmas",
    person: "Taylor Wilson",
    date: "December 25, 2023",
    daysAway: 90,
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: true,
    autoGiftAmount: 100
  }
];

const UpcomingEvents = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Upcoming Gift Occasions</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingEvents.map((event) => (
          <Card key={event.id} className={event.daysAway <= 14 ? "border-red-200" : ""}>
            <CardHeader className={event.daysAway <= 14 ? "bg-red-50" : ""}>
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
                {event.daysAway <= 14 && (
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
              <Button variant="outline" size="sm">
                <Gift className="mr-2 h-3 w-3" />
                Send Gift Now
              </Button>
              {event.autoGiftEnabled ? (
                <Button variant="ghost" size="sm">
                  Edit Auto-Gift
                </Button>
              ) : (
                <Button variant="ghost" size="sm">
                  <CreditCard className="mr-2 h-3 w-3" />
                  Enable Auto-Gift
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
