import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap, 
  Shield, 
  Activity,
  TrendingUp
} from "lucide-react";
import { useAutoGiftEventTracking, AutoGiftEventLog } from "@/hooks/useAutoGiftEventTracking";
import { formatDistanceToNow } from "date-fns";

interface AutoGiftEventTrackerProps {
  show?: boolean;
}

const AutoGiftEventTracker: React.FC<AutoGiftEventTrackerProps> = ({ show = false }) => {
  const {
    eventLogs,
    loading,
    error,
    getSetupFlowEvents,
    getErrorEvents,
    getSetupCompletionRate
  } = useAutoGiftEventTracking();

  if (!show) return null;

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('failed') || eventType.includes('error')) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (eventType.includes('created') || eventType.includes('completed')) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    }
    if (eventType.includes('initiated') || eventType.includes('setup')) {
      return <Clock className="h-4 w-4 text-warning" />;
    }
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getEventBadgeVariant = (eventType: string): "default" | "destructive" | "outline" | "secondary" => {
    if (eventType.includes('failed') || eventType.includes('error')) {
      return "destructive";
    }
    if (eventType.includes('created') || eventType.includes('completed')) {
      return "default"; // Changed from "success" to "default"
    }
    if (eventType.includes('initiated') || eventType.includes('setup')) {
      return "secondary";
    }
    return "outline";
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-lg">Auto-Gift Event Tracking</CardTitle>
          </div>
          <CardDescription>Loading security and event logs...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">Event Tracking Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const setupEvents = getSetupFlowEvents();
  const errorEvents = getErrorEvents();
  const completionRate = getSetupCompletionRate();

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm font-medium">Setup Success Rate</p>
                <p className="text-2xl font-bold text-success">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Events</p>
                <p className="text-2xl font-bold">{eventLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium">Errors</p>
                <p className="text-2xl font-bold text-destructive">{errorEvents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-lg">Auto-Gift Security Events</CardTitle>
          </div>
          <CardDescription>
            Real-time tracking of auto-gifting setup and execution events with webhook-inspired security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {eventLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No events recorded yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Events will appear here when you interact with auto-gifting features
                  </p>
                </div>
              ) : (
                eventLogs.map((event: AutoGiftEventLog) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <div className="mt-1">
                      {getEventIcon(event.event_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getEventBadgeVariant(event.event_type)}>
                          {formatEventType(event.event_type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {event.error_message && (
                        <p className="text-sm text-destructive mb-2">
                          Error: {event.error_message}
                        </p>
                      )}
                      
                      {/* Event Data Preview */}
                      {Object.keys(event.event_data).length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <details className="cursor-pointer">
                            <summary className="hover:text-foreground">View Details</summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(event.event_data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                      
                      {/* Setup Token Info */}
                      {event.setup_token && (
                        <div className="mt-2 flex items-center gap-2">
                          <Zap className="h-3 w-3 text-primary" />
                          <span className="text-xs text-muted-foreground">
                            Secured with token validation
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoGiftEventTracker;