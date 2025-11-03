import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Laptop, Smartphone, LogOut, Shield, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const SessionManagement = () => {
  const { user } = useAuth();
  const { sessions, loading, signOutSession, signOutAllOtherSessions, isCurrentSession } =
    useSessionManagement(user?.id);
  const [sessionToTerminate, setSessionToTerminate] = React.useState<string | null>(null);
  const [showTerminateAll, setShowTerminateAll] = React.useState(false);

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Laptop className="h-5 w-5" />;
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Laptop className="h-5 w-5" />;
  };

  const getDeviceInfo = (locationData: any, userAgent: string | null) => {
    if (locationData?.deviceDescription) {
      return locationData.deviceDescription;
    }
    
    // Fallback parsing
    if (!userAgent) return 'Unknown Device';
    
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Linux')) return 'Linux PC';
    
    return 'Unknown Device';
  };

  const getLocation = (locationData: any) => {
    if (locationData?.timezone) {
      return locationData.timezone.replace(/_/g, ' ');
    }
    return 'Unknown Location';
  };

  const handleTerminateSession = async (sessionId: string) => {
    await signOutSession(sessionId);
    setSessionToTerminate(null);
  };

  const handleTerminateAllOthers = async () => {
    await signOutAllOtherSessions();
    setShowTerminateAll(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const otherSessions = sessions.filter((s) => !isCurrentSession(s.session_token));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage devices and browsers where you're currently signed in. 
            Sign out of sessions you don't recognize.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No active sessions found. You may need to refresh the page.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Current Session */}
              {sessions
                .filter((session) => isCurrentSession(session.session_token))
                .map((session) => (
                  <div
                    key={session.id}
                    className="flex items-start gap-4 p-4 border rounded-lg bg-primary/5 border-primary/20"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getDeviceIcon(session.user_agent)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">
                          {getDeviceInfo(session.location_data, session.user_agent)}
                        </h4>
                        <Badge variant="default" className="text-xs">
                          Current Session
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {getLocation(session.location_data)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Active {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Other Sessions */}
              {otherSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 bg-muted rounded-lg">
                    {getDeviceIcon(session.user_agent)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">
                        {getDeviceInfo(session.location_data, session.user_agent)}
                      </h4>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {getLocation(session.location_data)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Last active{' '}
                        {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSessionToTerminate(session.id)}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ))}

              {/* Sign Out All Others Button */}
              {otherSessions.length > 0 && (
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => setShowTerminateAll(true)}
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out All Other Sessions
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Terminate Single Session Dialog */}
      <AlertDialog open={!!sessionToTerminate} onOpenChange={() => setSessionToTerminate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out This Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of this device or browser. You'll need to sign in again to use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToTerminate && handleTerminateSession(sessionToTerminate)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminate All Other Sessions Dialog */}
      <AlertDialog open={showTerminateAll} onOpenChange={setShowTerminateAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out All Other Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of all devices and browsers except this one. You'll need to sign in again
              on those devices. This is useful if you suspect unauthorized access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminateAllOthers}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out All Others
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
