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
  
  console.log('📊 RecipientEventsWidget rendering:', { eventsCount: events.length, loading, error, events });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Recipient Events
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Recipient Events
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

  const upcomingEvents = events.slice(0, maxEvents);

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Recipient Events
            </CardTitle>
            <CardDescription>
              Upcoming birthdays and special occasions for your connections
            </CardDescription>
          </div>
          {upcomingEvents.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {events.length} total
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    {getEventIcon(event.eventType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{event.recipientName}</h4>
                      {event.hasAutoGift && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          Auto-Gift Set
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{event.eventType}</span>
                      <span>•</span>
                      <span>{format(new Date(event.eventDate), 'MMM d, yyyy')}</span>
                      {event.daysUntil <= 14 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
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
                
                <div className="flex gap-2">
                  {!event.hasAutoGift && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onSetupAutoGift?.(event)}
                      className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Plus className="h-3 w-3" />
                      Auto-Gift
                    </Button>
                  )}
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => onSendGift?.(event)}
                    className="bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                  >
                    Send Gift
                  </Button>
                </div>
              </div>
            ))}
            
            {events.length > maxEvents && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  +{events.length - maxEvents} more upcoming events
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Connect with friends and family to see their special occasions
            </p>
            <Button variant="outline" size="sm">
              Invite Connections
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipientEventsWidget;