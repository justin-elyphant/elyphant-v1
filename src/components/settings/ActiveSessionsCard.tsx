import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smartphone, Monitor, Tablet, Clock, Shield, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { 
  getUserSessions, 
  terminateSession, 
  terminateAllOtherSessions,
  type SessionInfo 
} from '@/services/security/SessionLimitService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MAX_VISIBLE_SESSIONS = 3;

export function ActiveSessionsCard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTerminateAll, setShowTerminateAll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getUserSessions(user.id);
    setSessions(data);
    setIsLoading(false);
  };

  const handleTerminateSession = async (sessionId: string) => {
    const success = await terminateSession(sessionId);
    if (success) {
      toast.success('Session terminated');
      loadSessions();
    } else {
      toast.error('Failed to terminate session');
    }
  };

  const handleTerminateAll = async () => {
    if (!user) return;
    const count = await terminateAllOtherSessions(user.id);
    setShowTerminateAll(false);
    if (count > 0) {
      toast.success(`Terminated ${count} session${count > 1 ? 's' : ''}`);
      loadSessions();
    } else {
      toast.info('No other sessions to terminate');
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="h-4 w-4 text-muted-foreground" />;
    if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android')) {
      return <Smartphone className="h-4 w-4 text-muted-foreground" />;
    }
    if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      return <Tablet className="h-4 w-4 text-muted-foreground" />;
    }
    return <Monitor className="h-4 w-4 text-muted-foreground" />;
  };

  const getDeviceName = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown Device';
    
    // Extract browser name
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edge')) return 'Edge';
    
    // Fallback to cleaned user agent
    return userAgent.split('(')[0]?.trim() || 'Unknown Device';
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Sort sessions: current first, then by last activity
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
  });

  const visibleSessions = isExpanded ? sortedSessions : sortedSessions.slice(0, MAX_VISIBLE_SESSIONS);
  const hasMoreSessions = sortedSessions.length > MAX_VISIBLE_SESSIONS;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Active Sessions
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Active Sessions
                <Badge variant="secondary" className="ml-1 text-xs">
                  {sessions.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Manage signed-in devices
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button 
                variant="destructive" 
                size="sm"
                className="shrink-0 text-xs h-8"
                onClick={() => setShowTerminateAll(true)}
              >
                Sign Out Others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {sessions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active sessions</p>
            </div>
          ) : (
            <>
              <ScrollArea className={isExpanded && sortedSessions.length > 4 ? "h-[280px]" : undefined}>
                <div className="space-y-2">
                  {visibleSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                        session.isCurrent 
                          ? 'border-primary/30 bg-primary/5' 
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="shrink-0">
                          {getDeviceIcon(session.userAgent)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {getDeviceName(session.userAgent)}
                            </span>
                            {session.isCurrent && (
                              <Badge variant="default" className="text-xs px-1.5 py-0 h-5 shrink-0">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(session.lastActivityAt)}
                            {session.locationData?.country && (
                              <span className="ml-2">
                                • {session.locationData.city || session.locationData.country}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {!session.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-xs h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleTerminateSession(session.id)}
                        >
                          Sign Out
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {hasMoreSessions && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs h-8 text-muted-foreground"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show {sortedSessions.length - MAX_VISIBLE_SESSIONS} more
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showTerminateAll} onOpenChange={setShowTerminateAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out all other sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of all devices except this one. You'll need to sign in again on those devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTerminateAll}>
              Sign Out All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
