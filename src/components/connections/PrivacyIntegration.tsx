
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Eye, EyeOff, Users, Lock, Settings } from "lucide-react";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";
import { useNavigate } from "react-router-dom";

interface PrivacyIntegrationProps {
  userId?: string;
  showOwnSettings?: boolean;
}

const PrivacyIntegration: React.FC<PrivacyIntegrationProps> = ({
  userId,
  showOwnSettings = false
}) => {
  const { settings, loading } = usePrivacySettings();
  const navigate = useNavigate();

  const handleManageSettings = () => {
    navigate('/settings?tab=privacy');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'public':
      case 'everyone':
        return <Eye className="h-4 w-4 text-green-600" />;
      case 'connections_only':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'private':
      case 'nobody':
        return <Lock className="h-4 w-4 text-red-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPrivacyLabel = (level: string) => {
    switch (level) {
      case 'public':
        return 'Public';
      case 'connections_only':
        return 'Connections Only';
      case 'everyone':
        return 'Everyone';
      case 'private':
        return 'Private';
      case 'nobody':
        return 'Nobody';
      default:
        return 'Unknown';
    }
  };

  const getPrivacyColor = (level: string) => {
    switch (level) {
      case 'public':
      case 'everyone':
        return 'bg-green-100 text-green-800';
      case 'connections_only':
        return 'bg-blue-100 text-blue-800';
      case 'private':
      case 'nobody':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showOwnSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Privacy Settings
            </div>
            <Button
              onClick={handleManageSettings}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Manage Settings
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection requests</span>
                <Badge
                  variant="secondary"
                  className={getPrivacyColor(settings.allow_connection_requests_from)}
                >
                  <div className="flex items-center gap-1">
                    {getPrivacyIcon(settings.allow_connection_requests_from)}
                    {getPrivacyLabel(settings.allow_connection_requests_from)}
                  </div>
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Profile visibility</span>
                <Badge
                  variant="secondary"
                  className={getPrivacyColor(settings.profile_visibility)}
                >
                  <div className="flex items-center gap-1">
                    {getPrivacyIcon(settings.profile_visibility)}
                    {getPrivacyLabel(settings.profile_visibility)}
                  </div>
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Message requests</span>
                <Badge
                  variant="secondary"
                  className={settings.allow_message_requests ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                >
                  <div className="flex items-center gap-1">
                    {settings.allow_message_requests ?
                      <Eye className="h-4 w-4" /> :
                      <EyeOff className="h-4 w-4" />
                    }
                    {settings.allow_message_requests ? 'Enabled' : 'Disabled'}
                  </div>
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {getPrivacyIcon(settings.profile_visibility)}
      <span>{getPrivacyLabel(settings.profile_visibility)} Profile</span>
    </div>
  );
};

export default PrivacyIntegration;
