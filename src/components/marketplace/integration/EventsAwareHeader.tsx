import React, { useState, useEffect } from "react";
import { Calendar, Gift, Users, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { unifiedDataService } from "@/services/unified/UnifiedDataService";
import { format, differenceInDays, isToday, isTomorrow } from "date-fns";

interface UpcomingEvent {
  id: string;
  connectionName: string;
  connectionImage?: string;
  eventType: string;
  date: string;
  daysUntil: number;
  relationship: string;
  suggestedBudget?: [number, number];
}

interface EventsAwareHeaderProps {
  isVisible?: boolean;
  searchQuery?: string;
}

const EventsAwareHeader: React.FC<EventsAwareHeaderProps> = ({ 
  isVisible = true,
  searchQuery = ""
}) => {
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      setLoading(true);
      const userData = await unifiedDataService.getUserData();
      if (!userData) return;

      const events: UpcomingEvent[] = [];
      
      // Process connections for upcoming events
      for (const connection of userData.connections) {
        if (connection.upcomingEvents?.length > 0) {
          for (const event of connection.upcomingEvents.slice(0, 2)) {
            const eventDate = new Date(event.date);
            const daysUntil = differenceInDays(eventDate, new Date());
            
            if (daysUntil >= 0 && daysUntil <= 30) {
              events.push({
                id: `${connection.id}-${event.id}`,
                connectionName: connection.profile?.name || 'Unknown',
                connectionImage: connection.profile?.profile_image,
                eventType: event.date_type || 'special day',
                date: event.date,
                daysUntil,
                relationship: connection.relationship_type,
                suggestedBudget: getSuggestedBudget(connection.relationship_type, event.date_type)
              });
            }
          }
        }
      }

      // Sort by proximity (soonest first)
      events.sort((a, b) => a.daysUntil - b.daysUntil);
      setUpcomingEvents(events.slice(0, 6));
    } catch (error) {
      console.error('Error loading upcoming events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedBudget = (relationship: string, eventType: string): [number, number] => {
    const budgetMap: Record<string, Record<string, [number, number]>> = {
      family: {
        birthday: [30, 80],
        anniversary: [50, 120],
        default: [25, 75]
      },
      friend: {
        birthday: [20, 60],
        default: [15, 50]
      },
      spouse: {
        birthday: [75, 200],
        anniversary: [100, 250],
        default: [50, 150]
      }
    };

    return budgetMap[relationship]?.[eventType] || budgetMap[relationship]?.default || [20, 80];
  };

  const formatTimeUntil = (daysUntil: number): string => {
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Tomorrow";
    if (daysUntil <= 7) return `${daysUntil} days`;
    if (daysUntil <= 14) return `${Math.round(daysUntil / 7)} week`;
    return `${Math.round(daysUntil / 7)} weeks`;
  };

  const getTimeUrgency = (daysUntil: number): 'urgent' | 'soon' | 'upcoming' => {
    if (daysUntil <= 2) return 'urgent';
    if (daysUntil <= 7) return 'soon';
    return 'upcoming';
  };

  const handleEventClick = (event: UpcomingEvent) => {
    const [minBudget, maxBudget] = event.suggestedBudget || [20, 100];
    const searchParams = new URLSearchParams({
      mode: 'nicole',
      open: 'true',
      recipient: event.connectionName,
      occasion: event.eventType,
      relationship: event.relationship,
      budget_min: minBudget.toString(),
      budget_max: maxBudget.toString(),
      greeting: 'event_aware'
    });
    
    navigate(`/marketplace?${searchParams.toString()}`);
  };

  if (!isVisible || loading || upcomingEvents.length === 0) {
    return null;
  }

  const displayedEvents = expanded ? upcomingEvents : upcomingEvents.slice(0, 3);
  const hasMoreEvents = upcomingEvents.length > 3;

  return (
    <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">
              Upcoming Events - Perfect Time to Shop!
            </h3>
          </div>
          {hasMoreEvents && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-purple-700 hover:text-purple-900"
            >
              {expanded ? 'Show Less' : `+${upcomingEvents.length - 3} More`}
              <ChevronRight className={`ml-1 h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedEvents.map((event) => {
            const urgency = getTimeUrgency(event.daysUntil);
            
            return (
              <Card
                key={event.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 bg-white/80"
                onClick={() => handleEventClick(event)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={event.connectionImage} />
                      <AvatarFallback className="bg-purple-100 text-purple-800">
                        {event.connectionName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {event.connectionName}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            urgency === 'urgent' 
                              ? 'bg-red-100 text-red-800' 
                              : urgency === 'soon'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {formatTimeUntil(event.daysUntil)}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground capitalize mb-1">
                        {event.eventType} • {event.relationship}
                      </p>
                      
                      {event.suggestedBudget && (
                        <div className="flex items-center gap-1 text-xs text-green-700">
                          <Gift className="h-3 w-3" />
                          ${event.suggestedBudget[0]} - ${event.suggestedBudget[1]}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {displayedEvents.length > 0 && (
          <div className="mt-4 pt-3 border-t border-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Clock className="h-4 w-4" />
              <span>Don't miss these special moments!</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/connections')}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Users className="h-4 w-4 mr-1" />
              View All Events
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventsAwareHeader;