import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Trash2, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  getTrustedDevices, 
  revokeTrustedDevice, 
  trustCurrentDevice,
  generateDeviceName,
  type TrustedDevice 
} from '@/services/security/TrustedDeviceService';
import { useSessionTracking } from '@/hooks/useSessionTracking';
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

export function TrustedDevicesCard() {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const sessionTracking = useSessionTracking(session);
  const deviceFingerprint = sessionTracking.sessionId; // Use session ID as device fingerprint
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokeDeviceId, setRevokeDeviceId] = useState<string | null>(null);
  const [isCurrentTrusted, setIsCurrentTrusted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    loadDevices();
  }, [user, deviceFingerprint]);

  const loadDevices = async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getTrustedDevices(user.id);
    setDevices(data);
    
    // Check if current device is trusted
    if (deviceFingerprint) {
      const isTrusted = data.some(d => d.deviceFingerprint === deviceFingerprint);
      setIsCurrentTrusted(isTrusted);
    }
    
    setIsLoading(false);
  };

  const handleTrustDevice = async () => {
    if (!user || !deviceFingerprint) return;
    
    const deviceName = generateDeviceName(navigator.userAgent);
    const success = await trustCurrentDevice(user.id, deviceFingerprint, deviceName);
    
    if (success) {
      toast.success('Device trusted', {
        description: 'This device will skip additional security checks'
      });
      loadDevices();
    } else {
      toast.error('Failed to trust device');
    }
  };

  const handleRevokeDevice = async () => {
    if (!revokeDeviceId) return;
    
    const success = await revokeTrustedDevice(revokeDeviceId);
    setRevokeDeviceId(null);
    
    if (success) {
      toast.success('Device trust revoked');
      loadDevices();
    } else {
      toast.error('Failed to revoke device trust');
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trusted Devices</CardTitle>
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
                Trusted Devices
              </CardTitle>
              <CardDescription>
                Trusted devices skip additional security verification
              </CardDescription>
            </div>
            {!isCurrentTrusted && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTrustDevice}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Trust This Device
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {devices.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="mb-2">No trusted devices yet</p>
              <p className="text-sm">
                Trust devices you use regularly to skip extra security checks
              </p>
            </div>
          ) : (
            devices.map((device) => {
              const isCurrentDevice = device.deviceFingerprint === deviceFingerprint;
              
              return (
                <div
                  key={device.id}
                  className={`p-4 rounded-lg border ${
                    isCurrentDevice ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{device.deviceName}</span>
                        {isCurrentDevice && (
                          <Badge variant="default">This Device</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Trusted {formatDate(device.trustedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last used {formatDate(device.lastUsedAt)}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevokeDeviceId(device.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!revokeDeviceId} onOpenChange={() => setRevokeDeviceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke device trust?</AlertDialogTitle>
            <AlertDialogDescription>
              This device will require additional security verification on next sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeDevice}>
              Revoke Trust
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
