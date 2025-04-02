
import React from "react";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const EventsCard = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-500" />
          Upcoming Events
        </CardTitle>
        <CardDescription>
          Important dates to remember
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Track birthdays, holidays, and special occasions to never miss a gift.
          </p>
          <Button className="w-full" asChild>
            <Link to="/events">Manage Events</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsCard;
