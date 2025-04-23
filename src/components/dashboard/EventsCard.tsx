
import React from "react";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const EventsCard = () => {
  // Mock data for upcoming auto-gifts
  const upcomingGifts = [
    { name: "Sarah's Birthday", date: "May 15", budget: "$50" },
    { name: "Anniversary Gift", date: "May 28", budget: "$100" },
    { name: "Dad's Birthday", date: "June 10", budget: "$75" },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-500" />
          Auto-Gift Hub
        </CardTitle>
        <CardDescription className="text-sm">
          Upcoming automated gifts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingGifts.length > 0 ? (
            <div className="space-y-3">
              {upcomingGifts.map((gift, index) => (
                <div key={index} className="flex justify-between items-center text-sm pb-2 border-b last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{gift.name}</p>
                    <p className="text-muted-foreground text-xs">{gift.date}</p>
                  </div>
                  <span className="text-green-600 font-medium">{gift.budget}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming auto-gifts scheduled</p>
          )}
          <Button className="w-full" size="sm" asChild>
            <Link to="/events">Manage Auto-Gifts</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsCard;
