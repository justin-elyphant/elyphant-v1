import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Gift, Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { EventsProvider, useEvents } from "@/components/gifting/events/context/EventsContext";
import { useAuth } from "@/contexts/auth";

interface UpcomingEventsCardContentProps {
  onAddEvent?: () => void;
}

const UpcomingEventsCardContent = ({ onAddEvent }: UpcomingEventsCardContentProps) => {
  const { events, isLoading } = useEvents();
  const { user } = useAuth();
  const location = useLocation();
  const isOnEventsPage = location.pathname === '/events';

  // Filter to upcoming events only and sort by date
  const upcomingEvents = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => {
        if (!event.dateObj) return false;
        return event.dateObj >= today;
      })
      .sort((a, b) => {
        if (!a.dateObj || !b.dateObj) return 0;
        return a.dateObj.getTime() - b.dateObj.getTime();
      })
      .slice(0, 3); // Show only first 3 upcoming events
  }, [events]);

  // Don't show the card if user is not authenticated
  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-2 border-purple-100 h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                Auto-Gift Hub
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Loading your upcoming events...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-100 h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-500" />
              Auto-Gift Hub
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {upcomingEvents.length > 0 
                ? `${upcomingEvents.length} upcoming gift occasion${upcomingEvents.length > 1 ? 's' : ''}`
                : "No upcoming events scheduled"
              }
            </CardDescription>
          </div>
          <Link to="/events" className="text-sm text-muted-foreground hover:text-primary flex items-center">
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.length > 0 ? (
            <>
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      {event.type.toLowerCase().includes("birthday") ? (
                        <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{event.person}</h4>
                        {event.privacyLevel === 'shared' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs">
                            Shared
                          </Badge>
                        )}
                        {event.privacyLevel === 'public' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-xs">
                            Public
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>{event.type}</span>
                        <span>•</span>
                        <span>{event.dateObj ? format(event.dateObj, 'MMM d, yyyy') : event.date}</span>
                        
                        {event.daysAway <= 7 && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600 dark:text-orange-400 font-medium flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {event.daysAway === 0 ? 'Today' : 
                               event.daysAway === 1 ? 'Tomorrow' : 
                               `${event.daysAway} days`}
                            </span>
                          </>
                        )}
                        
                        {event.autoGiftEnabled && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              Auto-Gift: ${event.autoGiftAmount}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button size="sm" variant={event.autoGiftEnabled ? "outline" : "default"}>
                    {event.autoGiftEnabled ? "Manage" : "Set Up"}
                  </Button>
                </div>
              ))}
              
              {events.length > 3 && (
                <div className="text-center pt-2">
                  <Link to="/events" className="text-sm text-muted-foreground hover:text-primary">
                    +{events.length - 3} more event{events.length - 3 > 1 ? 's' : ''}
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Add birthdays, anniversaries, and other special occasions to never miss a gift opportunity.
              </p>
            </div>
          )}
          
          {/* Conditional button logic based on current page */}
          {isOnEventsPage && onAddEvent ? (
            <Button 
              variant="outline" 
              className="w-full border-dashed" 
              onClick={onAddEvent}
            >
              <Gift className="h-4 w-4 mr-2" />
              Add New Event
            </Button>
          ) : (
            <Button variant="outline" className="w-full border-dashed" asChild>
              <Link to="/events?action=add">
                <Gift className="h-4 w-4 mr-2" />
                Add New Event
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface UpcomingEventsCardProps {
  onAddEvent?: () => void;
}

const UpcomingEventsCard = ({ onAddEvent }: UpcomingEventsCardProps) => {
  return (
    <EventsProvider>
      <UpcomingEventsCardContent onAddEvent={onAddEvent} />
    </EventsProvider>
  );
};

export default UpcomingEventsCard;
