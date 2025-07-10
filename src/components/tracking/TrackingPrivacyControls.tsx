import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Eye, 
  EyeOff, 
  Shield, 
  Users, 
  MapPin, 
  Bell,
  Info,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TrackingPrivacyControlsProps {
  projectId: string;
  isCoordinator: boolean;
  recipientId?: string;
  recipientName?: string;
  contributors: Array<{
    id: string;
    name: string;
    profile_image?: string;
    role?: string;
  }>;
  onSettingsUpdate?: (settings: any) => void;
}

interface PrivacySettings {
  hideFromRecipient: boolean;
  contributorTrackingAccess: 'full' | 'status_only' | 'none';
  showDeliveryAddress: boolean;
  sendDeliveryNotifications: boolean;
  sendStatusUpdates: boolean;
  allowRecipientTracking: boolean;
}

const TrackingPrivacyControls = ({
  projectId,
  isCoordinator,
  recipientId,
  recipientName,
  contributors,
  onSettingsUpdate
}: TrackingPrivacyControlsProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PrivacySettings>({
    hideFromRecipient: true,
    contributorTrackingAccess: 'full',
    showDeliveryAddress: false,
    sendDeliveryNotifications: true,
    sendStatusUpdates: true,
    allowRecipientTracking: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = async (key: keyof PrivacySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Auto-save settings
    setIsSaving(true);
    try {
      // In real app, save to database
      await new Promise(resolve => setTimeout(resolve, 500));
      onSettingsUpdate?.(newSettings);
      toast("Privacy settings updated");
    } catch (error) {
      console.error('Error updating settings:', error);
      toast("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const getAccessLevelDescription = (level: string) => {
    switch (level) {
      case 'full':
        return 'Can see detailed tracking timeline and carrier information';
      case 'status_only':
        return 'Can only see basic status updates (shipped, delivered)';
      case 'none':
        return 'Cannot see any tracking information';
      default:
        return '';
    }
  };

  if (!isCoordinator) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Your Tracking Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Tracking Timeline</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Eye className="h-3 w-3 mr-1" />
                Full Access
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Delivery Address</span>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                <EyeOff className="h-3 w-3 mr-1" />
                Hidden
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Status Notifications</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Bell className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recipient Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Recipient Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recipientName && (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Gift Recipient</p>
                <p className="text-xs text-muted-foreground">{recipientName}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="hide-recipient" className="text-sm font-medium">
                  Hide tracking from recipient
                </Label>
                <p className="text-xs text-muted-foreground">
                  Keep the gift a surprise by hiding all tracking information
                </p>
              </div>
              <Switch
                id="hide-recipient"
                checked={settings.hideFromRecipient}
                onCheckedChange={(checked) => handleSettingChange('hideFromRecipient', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="recipient-tracking" className="text-sm font-medium">
                  Allow recipient to track after delivery
                </Label>
                <p className="text-xs text-muted-foreground">
                  Let recipient see tracking info once gift is delivered
                </p>
              </div>
              <Switch
                id="recipient-tracking"
                checked={settings.allowRecipientTracking}
                onCheckedChange={(checked) => handleSettingChange('allowRecipientTracking', checked)}
                disabled={settings.hideFromRecipient}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contributor Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Contributor Access ({contributors.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {contributors.slice(0, 6).map((contributor) => (
              <div key={contributor.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={contributor.profile_image} alt={contributor.name} />
                  <AvatarFallback className="text-xs">
                    {contributor.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate">{contributor.name}</span>
                {contributor.role === 'coordinator' && (
                  <Badge variant="secondary" className="text-xs">Coord</Badge>
                )}
              </div>
            ))}
            {contributors.length > 6 && (
              <div className="flex items-center justify-center p-2 bg-muted/30 rounded text-xs">
                +{contributors.length - 6} more
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Tracking Information Access
              </Label>
              <div className="space-y-2">
                {['full', 'status_only', 'none'].map((level) => (
                  <label key={level} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="contributorAccess"
                      value={level}
                      checked={settings.contributorTrackingAccess === level}
                      onChange={(e) => handleSettingChange('contributorTrackingAccess', e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium capitalize">
                        {level.replace('_', ' ')} Access
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getAccessLevelDescription(level)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="show-address" className="text-sm font-medium">
                  Show delivery address
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow contributors to see where the gift is being delivered
                </p>
              </div>
              <Switch
                id="show-address"
                checked={settings.showDeliveryAddress}
                onCheckedChange={(checked) => handleSettingChange('showDeliveryAddress', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="delivery-notifications" className="text-sm font-medium">
                Send delivery notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Notify all contributors when the gift is delivered
              </p>
            </div>
            <Switch
              id="delivery-notifications"
              checked={settings.sendDeliveryNotifications}
              onCheckedChange={(checked) => handleSettingChange('sendDeliveryNotifications', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="status-updates" className="text-sm font-medium">
                Send status updates
              </Label>
              <p className="text-xs text-muted-foreground">
                Notify contributors of major shipping milestones
              </p>
            </div>
            <Switch
              id="status-updates"
              checked={settings.sendStatusUpdates}
              onCheckedChange={(checked) => handleSettingChange('sendStatusUpdates', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings Preview */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4" />
            Current Settings Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Recipient can see tracking</span>
              <Badge variant={settings.hideFromRecipient ? "secondary" : "default"}>
                {settings.hideFromRecipient ? "Hidden" : "Visible"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Contributors can see</span>
              <Badge variant="outline" className="capitalize">
                {settings.contributorTrackingAccess.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery address visible</span>
              <Badge variant={settings.showDeliveryAddress ? "default" : "secondary"}>
                {settings.showDeliveryAddress ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Notifications enabled</span>
              <Badge variant={settings.sendStatusUpdates ? "default" : "secondary"}>
                {settings.sendStatusUpdates ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
          
          {isSaving && (
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
              Saving settings...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackingPrivacyControls;