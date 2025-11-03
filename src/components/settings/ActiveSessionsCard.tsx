import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Tablet, MapPin, Clock, Shield, AlertCircle } from 'lucide-react';
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

export function ActiveSessionsCard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTerminateAll, setShowTerminateAll] = useState(false);

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
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage devices that are currently signed in to your account
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowTerminateAll(true)}
              >
                Sign Out All Others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active sessions found</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-lg border ${
                  session.isCurrent ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(session.userAgent)}
                      <span className="font-medium">
                        {session.userAgent?.split('(')[0]?.trim() || 'Unknown Device'}
                      </span>
                      {session.isCurrent && (
                        <Badge variant="default" className="ml-2">
                          Current Device
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {session.locationData?.country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.locationData.city && `${session.locationData.city}, `}
                          {session.locationData.country}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(session.lastActivityAt)}
                      </div>
                    </div>
                    
                    {session.ipAddress && (
                      <div className="text-xs text-muted-foreground">
                        IP: {session.ipAddress}
                      </div>
                    )}
                  </div>
                  
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTerminateSession(session.id)}
                    >
                      Sign Out
                    </Button>
                  )}
                </div>
              </div>
            ))
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
