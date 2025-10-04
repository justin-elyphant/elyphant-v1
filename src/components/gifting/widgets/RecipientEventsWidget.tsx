import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Gift, Users, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useRecipientEvents } from '@/hooks/useRecipientEvents';

interface RecipientEventsWidgetProps {
  onSetupAutoGift?: (event: any) => void;
  onSendGift?: (event: any) => void;
  maxEvents?: number;
}

const RecipientEventsWidget: React.FC<RecipientEventsWidgetProps> = ({
  onSetupAutoGift,
  onSendGift,
  maxEvents = 5
}) => {
  const { events, loading, error } = useRecipientEvents();
  
  // Filter out events that already have auto-gifting enabled
  const eventsWithoutAutoGift = events.filter(event => !event.hasAutoGift);
  
  console.log('📊 RecipientEventsWidget rendering:', { 
    totalEvents: events.length, 
    eventsNeedingAttention: eventsWithoutAutoGift.length,
    loading, 
    error 
  });

  if (loading) {
    return (
      <Card className="mb-24 md:mb-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Action Needed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
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

  if (error) {
    return (
      <Card className="mb-24 md:mb-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Action Needed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const upcomingEvents = eventsWithoutAutoGift.slice(0, maxEvents);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.toLowerCase().includes('birthday')) {
      return <Gift className="h-4 w-4" />;
    }
    return <Calendar className="h-4 w-4" />;
  };

  return (
    <Card className="mb-24 md:mb-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Action Needed
            </CardTitle>
            <CardDescription>
              Events that need auto-gift setup or manual attention
            </CardDescription>
          </div>
          {upcomingEvents.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{eventsWithoutAutoGift.length} need attention</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="mobile-card p-3 md:p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                {/* Mobile: Stack layout, Desktop: Side-by-side */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                      {getEventIcon(event.eventType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1">
                        <h4 className="font-medium truncate text-sm md:text-base">{event.recipientName}</h4>
                      </div>
                      {/* Mobile: Stack details vertically */}
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
                        <span className="truncate">{event.eventType}</span>
                        <span className="hidden md:inline">•</span>
                        <span className="truncate">{format(new Date(event.eventDate), 'MMM d, yyyy')}</span>
                        {event.daysUntil <= 14 && (
                          <>
                            <span className="hidden md:inline">•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getUrgencyColor(event.urgency)}`}
                              >
                                {event.daysUntil === 0 ? 'Today' : 
                                 event.daysUntil === 1 ? 'Tomorrow' : 
                                 `${event.daysUntil} days`}
                              </Badge>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile: Full-width button row, Desktop: Side buttons */}
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => {
                        console.log('🎯 Auto-Gift button clicked for event:', event);
                        const eventWithInitialData = {
                          ...event,
                          initialData: {
                            recipientId: event.recipientId,
                            eventType: event.eventType.toLowerCase(),
                            recipientName: event.recipientName,
                            eventDate: event.eventDate,
                            relationshipType: event.relationshipType
                          }
                        };
                        console.log('🎯 Calling onSetupAutoGift with:', eventWithInitialData);
                        onSetupAutoGift?.(eventWithInitialData);
                      }}
                      className="flex-1 md:flex-initial min-h-[44px] marketplace-touch-target bg-gradient-to-r from-orange-600 to-yellow-600 text-white border-0 hover:from-orange-700 hover:to-yellow-700 text-xs md:text-sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span>Set Up Auto-Gift</span>
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => onSendGift?.(event)}
                      className="flex-1 md:flex-initial min-h-[44px] marketplace-touch-target text-xs md:text-sm"
                    >
                      <span className="hidden sm:inline">Or Browse Gifts</span>
                      <span className="sm:hidden">Browse</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {eventsWithoutAutoGift.length > maxEvents && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  +{eventsWithoutAutoGift.length - maxEvents} more events need attention
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            {events.length > 0 ? (
              <>
                <Gift className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All events are on autopilot! 🎉</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  All your upcoming events have auto-gifting enabled
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                >
                  View Auto-Gift Rules
                </Button>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Connect with friends and family to see their special occasions
                </p>
                <Button variant="outline" size="sm">
                  Invite Connections
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipientEventsWidget;