
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Gift, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/contexts/auth";
import { eventsService } from "@/services/eventsService";
import EmptyState from "@/components/common/EmptyState";

interface UpcomingEventsCardContentProps {
  onAddEvent?: () => void;
}

const UpcomingEventsCardContent = ({ onAddEvent }: UpcomingEventsCardContentProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const isOnEventsPage = location.pathname === '/events';
  
  console.log('UpcomingEventsCard: Component mounted. User:', user);
  console.log('UpcomingEventsCard: Location:', location.pathname);
  
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all events from user_special_dates
  React.useEffect(() => {
    const loadEvents = async () => {
      if (!user) {
        console.log('UpcomingEventsCard: No user found');
        return;
      }
      
      console.log('UpcomingEventsCard: Loading events for user:', user.id);
      
      try {
        const fetchedEvents = await eventsService.fetchUserEvents();
        console.log('UpcomingEventsCard: Fetched events:', fetchedEvents);
        setAllEvents(fetchedEvents);
      } catch (error) {
        console.error('UpcomingEventsCard: Error loading events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [user]);

  // Filter to show ONLY events without auto-gifting enabled
  const upcomingEvents = React.useMemo(() => {
    console.log('UpcomingEventsCard: All events:', allEvents);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventsNeedingAttention = allEvents
      .filter(event => {
        // Only show events that DON'T have auto-gifting enabled
        return !event.autoGiftEnabled;
      })
      .map(event => {
        const eventDate = new Date(event.date);
        const daysAway = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...event,
          dateObj: eventDate,
          daysAway,
          urgency: daysAway <= 7 ? 'high' : daysAway <= 30 ? 'medium' : 'low',
        };
      })
      .filter(event => event.daysAway >= 0) // Only future events
      .sort((a, b) => a.daysAway - b.daysAway)
      .slice(0, 3);
      
    console.log('UpcomingEventsCard: Events needing attention:', eventsNeedingAttention);
    return eventsNeedingAttention;
  }, [allEvents]);

  const handleScheduleGift = (event: any) => {
    // Navigate to gifting flow for this event
    window.location.href = `/gifting?event=${event.id}&person=${encodeURIComponent(event.person)}`;
  };

  const handleSetupAutoGift = (event: any) => {
    // Navigate to auto-gift setup for this event
    window.location.href = `/gifting?autoGift=true&event=${event.id}`;
  };

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
    <>
      <Card className="border-2 border-orange-100 h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                Upcoming Friend Events
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                {upcomingEvents.length > 0 
                  ? `${upcomingEvents.length} event${upcomingEvents.length > 1 ? 's' : ''} need${upcomingEvents.length === 1 ? 's' : ''} your attention`
                  : "All events are on autopilot"
                }
              </CardDescription>
            </div>
            <Link to="/gifting" className="text-sm text-muted-foreground hover:text-primary flex items-center">
              View All
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              <>
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        {event.type?.toLowerCase().includes("birthday") ? (
                          <Gift className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{event.person}</h4>
                          <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 text-xs border-orange-300">
                            Not Auto-Gifted
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>{event.type}</span>
                          <span>•</span>
                          <span>{event.dateObj ? format(event.dateObj, 'MMM d, yyyy') : 'No date'}</span>
                          
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
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSetupAutoGift(event)}
                      >
                        Set Up Auto-Gift
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleScheduleGift(event)}
                      >
                        Schedule Gift
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <EmptyState
                icon={Calendar}
                title="All events on autopilot! 🎉"
                description="Every upcoming event has auto-gifting enabled. You're all set!"
                action={{
                  label: "View Gift Autopilot",
                  onClick: () => window.location.href = '/gifting',
                  variant: "outline"
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

interface UpcomingEventsCardProps {
  onAddEvent?: () => void;
}

const UpcomingEventsCard = ({ onAddEvent }: UpcomingEventsCardProps) => {
  return <UpcomingEventsCardContent onAddEvent={onAddEvent} />;
};

export default UpcomingEventsCard;
