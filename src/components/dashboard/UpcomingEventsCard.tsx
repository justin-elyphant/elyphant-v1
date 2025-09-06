
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Gift, Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import AutoGiftSetupFlow from "@/components/gifting/auto-gift/AutoGiftSetupFlow";

interface UpcomingEventsCardContentProps {
  onAddEvent?: () => void;
}

const UpcomingEventsCardContent = ({ onAddEvent }: UpcomingEventsCardContentProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const isOnEventsPage = location.pathname === '/events';
  
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [autoGiftRules, setAutoGiftRules] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load auto-gift rules and connections
  React.useEffect(() => {
    const loadData = async () => {
      if (!user) {
        console.log('UpcomingEventsCard: No user found');
        return;
      }
      
      console.log('UpcomingEventsCard: Loading data for user:', user.id);
      
      try {
        const [rulesResult, connectionsResult] = await Promise.all([
          supabase
            .from('auto_gifting_rules')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true),
          supabase
            .from('user_connections')
            .select('*')
            .eq('user_id', user.id)
        ]);

        console.log('UpcomingEventsCard: Rules result:', rulesResult);
        console.log('UpcomingEventsCard: Connections result:', connectionsResult);

        setAutoGiftRules(rulesResult.data || []);
        setConnections(connectionsResult.data || []);
      } catch (error) {
        console.error('UpcomingEventsCard: Error loading auto-gift data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Transform auto-gift rules into upcoming events
  const upcomingEvents = React.useMemo(() => {
    console.log('UpcomingEventsCard: Computing upcoming events from rules:', autoGiftRules);
    console.log('UpcomingEventsCard: Available connections:', connections);
    
    const today = new Date();
    
    const result = autoGiftRules
      .map(rule => {
        const connection = connections.find(c => c.id === rule.recipient_id);
        
        // Calculate next event date based on rule type
        let nextDate: Date | null = null;
        let displayType = rule.date_type;
        
        if (rule.date_type === 'just_because' && rule.scheduled_date) {
          nextDate = new Date(rule.scheduled_date);
          displayType = 'Surprise Gift';
        } else if (rule.date_type === 'birthday' && rule.event_date) {
          const birthDate = new Date(rule.event_date);
          const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          nextDate = thisYear > today ? thisYear : new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
          displayType = 'Birthday';
        } else if (rule.date_type === 'anniversary' && rule.event_date) {
          const anniversaryDate = new Date(rule.event_date);
          const thisYear = new Date(today.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
          nextDate = thisYear > today ? thisYear : new Date(today.getFullYear() + 1, anniversaryDate.getMonth(), anniversaryDate.getDate());
          displayType = 'Anniversary';
        } else if (['christmas', 'valentines', 'mothers_day', 'fathers_day'].includes(rule.date_type)) {
          const holidayDates = {
            christmas: new Date(today.getFullYear(), 11, 25),
            valentines: new Date(today.getFullYear(), 1, 14),
            mothers_day: new Date(today.getFullYear(), 4, 14), // Approximate
            fathers_day: new Date(today.getFullYear(), 5, 18), // Approximate
          };
          nextDate = holidayDates[rule.date_type as keyof typeof holidayDates];
          if (nextDate && nextDate < today) {
            nextDate = new Date(today.getFullYear() + 1, nextDate.getMonth(), nextDate.getDate());
          }
          displayType = rule.date_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        
        if (!nextDate) return null;
        
        const daysAway = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: rule.id,
          person: connection?.connected_user_name || 'Unknown',
          type: displayType,
          dateObj: nextDate,
          daysAway,
          urgency: daysAway <= 7 ? 'high' : daysAway <= 30 ? 'medium' : 'low',
          autoGiftEnabled: true,
          autoGiftAmount: rule.budget_max || rule.budget_min || 50,
          rule
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a?.daysAway || 0) - (b?.daysAway || 0))
      .slice(0, 3);
      
    console.log('UpcomingEventsCard: Final upcoming events:', result);
    return result;
  }, [autoGiftRules, connections]);

  const handleSetupAutoGift = (event: any) => {
    setSelectedEvent(event);
    setSetupDialogOpen(true);
  };

  const handleSendNow = async (event: any) => {
    // Redirect to Nicole for immediate gift selection
    window.location.href = `/nicole?giftFor=${encodeURIComponent(event.person)}&occasion=${encodeURIComponent(event.type)}&budget=${event.autoGiftAmount}`;
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
                          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-xs">
                            Auto-Gift
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
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSetupAutoGift(event)}
                      >
                        Modify Plan
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleSendNow(event)}
                      >
                        Send Now
                      </Button>
                    </div>
                  </div>
                ))}
                
                {autoGiftRules.length > 3 && (
                  <div className="text-center pt-2">
                    <Link to="/gifting" className="text-sm text-muted-foreground hover:text-primary">
                      +{autoGiftRules.length - 3} more auto-gift{autoGiftRules.length - 3 > 1 ? 's' : ''}
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Add special occasions to set up automated gifting
                </p>
                <Button 
                  variant="default" 
                  onClick={() => setSetupDialogOpen(true)}
                  className="mb-4"
                >
                  Set Up Auto-Gifting
                </Button>
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

      {/* Auto-Gift Setup Flow */}
      <AutoGiftSetupFlow
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
        eventId={selectedEvent?.id}
        eventType={selectedEvent?.type}
        recipientId={selectedEvent?.connectionId}
      />
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
