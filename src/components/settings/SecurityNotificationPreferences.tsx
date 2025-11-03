import { Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useAuth } from '@/contexts/auth/AuthProvider';

export const SecurityNotificationPreferences = () => {
  const { user } = useAuth();
  const { preferences, loading, updatePreferences } = useNotificationPreferences(user?.id);

  if (loading || !preferences) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground animate-pulse" />
          <div>
            <h3 className="font-semibold">Security Notifications</h3>
            <p className="text-sm text-muted-foreground">Loading preferences...</p>
          </div>
        </div>
      </Card>
    );
  }

  const handleToggle = (key: keyof typeof preferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Security Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Configure which security alerts you want to receive
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive security alerts via email
              </p>
            </div>
            <Switch
              id="email_notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => handleToggle('email_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="device_change_alerts">Device Change Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alert when a new device is detected
              </p>
            </div>
            <Switch
              id="device_change_alerts"
              checked={preferences.device_change_alerts}
              onCheckedChange={(checked) => handleToggle('device_change_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="location_change_alerts">Location Change Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alert when login location changes
              </p>
            </div>
            <Switch
              id="location_change_alerts"
              checked={preferences.location_change_alerts}
              onCheckedChange={(checked) => handleToggle('location_change_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="suspicious_activity_alerts">Suspicious Activity Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alert for unusual patterns and high-risk activities
              </p>
            </div>
            <Switch
              id="suspicious_activity_alerts"
              checked={preferences.suspicious_activity_alerts}
              onCheckedChange={(checked) => handleToggle('suspicious_activity_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new_session_alerts">New Session Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alert for every new login (may be frequent)
              </p>
            </div>
            <Switch
              id="new_session_alerts"
              checked={preferences.new_session_alerts}
              onCheckedChange={(checked) => handleToggle('new_session_alerts', checked)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
