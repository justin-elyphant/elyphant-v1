
import React, { useEffect, useState } from "react";
import { Bell, Gift, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "../context/EventsContext";
import { ExtendedEventData } from "../types";

interface EventNotification {
  id: string;
  event: ExtendedEventData;
  type: "urgent" | "reminder" | "info";
  message: string;
  daysUntil: number;
}

const EventNotifications = () => {
  const { events } = useEvents();
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Generate notifications for upcoming events
    const today = new Date();
    const upcomingNotifications: EventNotification[] = [];

    events.forEach(event => {
      if (event.dateObj && event.dateObj > today) {
        const daysUntil = Math.ceil((event.dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= 1) {
          upcomingNotifications.push({
            id: `urgent-${event.id}`,
            event,
            type: "urgent",
            message: `${event.person}'s ${event.type} is ${daysUntil === 0 ? 'today' : 'tomorrow'}!`,
            daysUntil,
          });
        } else if (daysUntil <= 7) {
          upcomingNotifications.push({
            id: `reminder-${event.id}`,
            event,
            type: "reminder",
            message: `${event.person}'s ${event.type} is in ${daysUntil} days`,
            daysUntil,
          });
        } else if (daysUntil <= 30) {
          upcomingNotifications.push({
            id: `info-${event.id}`,
            event,
            type: "info",
            message: `${event.person}'s ${event.type} is in ${daysUntil} days`,
            daysUntil,
          });
        }
      }
    });

    setNotifications(upcomingNotifications);
    setIsVisible(upcomingNotifications.length > 0);
  }, [events]);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "urgent": return "bg-red-100 border-red-300 text-red-800";
      case "reminder": return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "info": return "bg-blue-100 border-blue-300 text-blue-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "urgent": return <Gift className="h-4 w-4" />;
      case "reminder": return <Bell className="h-4 w-4" />;
      case "info": return <Calendar className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Bell className="h-5 w-5 mr-2" />
          Event Notifications
          <Badge variant="secondary" className="ml-2">
            {notifications.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.slice(0, 5).map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${getNotificationColor(notification.type)}`}
            >
              <div className="flex items-center space-x-3">
                {getNotificationIcon(notification.type)}
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
              <Button variant="outline" size="sm">
                View Event
              </Button>
            </div>
          ))}
          {notifications.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm">
                View {notifications.length - 5} more notifications
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventNotifications;
