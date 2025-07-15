import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Gift, Plus, Users, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/components/gifting/events/context/EventsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const GiftRemindersCard = () => {
  const isMobile = useIsMobile();
  const { events, isLoading } = useEvents();

  const upcomingEvents = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => event.dateObj && event.dateObj >= today)
      .map(event => ({
        ...event,
        daysAway: Math.ceil((event.dateObj!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime())
      .slice(0, 3);
  }, [events]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-blue-500" />
          Upcoming Events
          {upcomingEvents.length > 0 && (
            <Badge variant="secondary">{upcomingEvents.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <>
            {/* Upcoming Events Preview */}
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.person}</p>
                    <p className="text-xs text-muted-foreground">{event.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.dateObj ? format(event.dateObj, 'MMM d') : event.date}
                    </p>
                  </div>
                  {event.daysAway <= 7 && (
                    <Badge variant="outline" className="text-orange-600 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {event.daysAway === 0 ? 'Today' : 
                        event.daysAway === 1 ? 'Tomorrow' : 
                        `${event.daysAway}d`}
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className={cn(
              "grid gap-2",
              isMobile ? "grid-cols-1" : "grid-cols-2"
            )}>
              <Button variant="outline" size="sm" asChild>
                <Link to="/events" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  View All
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/events?tab=monitoring" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Auto-Gift
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h4 className="font-medium mb-2">No events yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add special dates to never miss a gift-giving opportunity
            </p>
            <Button asChild>
              <Link to="/events?action=add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Event
              </Link>
            </Button>
          </div>
        )}

        {/* Quick Social Actions */}
        <div className="pt-2 border-t">
          <Button variant="ghost" size="sm" asChild className="w-full">
            <Link to="/connections" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Find Friends & Family
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GiftRemindersCard;