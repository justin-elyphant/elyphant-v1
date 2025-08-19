import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserMinus, Calendar, Users, Heart, Settings } from "lucide-react";
import { Connection } from "@/types/connections";
import { getRelationshipIcon, getRelationshipLabel } from "@/components/connections/RelationshipUtils";
import { ConnectionPrivacyControls } from "@/components/connections/ConnectionPrivacyControls";
import { AutoGiftToggle } from "@/components/connections/AutoGiftToggle";
import { BirthdayCountdown } from "@/components/connections/BirthdayCountdown";
import { MutualConnectionsSection } from "@/components/connections/MutualConnectionsSection";
import { useAutoGiftPermission } from "@/hooks/useAutoGiftPermission";
import { autoGiftPermissionService } from "@/services/autoGiftPermissionService";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";

interface ConnectionTabContentProps {
  profile: any;
  connectionData?: {
    relationship?: string;
    customRelationship?: string;
    connectionDate?: string;
    isAutoGiftEnabled?: boolean;
    canRemoveConnection?: boolean;
    id?: string;
  };
  onRemoveConnection?: () => void;
  onRefreshConnection?: () => void;
}

const ConnectionTabContent: React.FC<ConnectionTabContentProps> = ({ 
  profile, 
  connectionData, 
  onRemoveConnection,
  onRefreshConnection 
}) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  // Create a connection object for the auto-gift permission hook
  const connectionForPermission = connectionData ? {
    id: connectionData.id || profile?.id,
    name: profile?.name,
    username: profile?.username,
    imageUrl: profile?.profile_image,
    relationship: connectionData.relationship || 'friend',
    customRelationship: connectionData.customRelationship,
    connectionDate: connectionData.connectionDate,
    // Add other required properties with defaults
    type: 'friend' as const,
    dataStatus: { shipping: 'verified', birthday: 'verified', email: 'verified' },
    interests: profile?.interests || [],
    bio: profile?.bio,
    mutualFriends: 0,
    lastActive: 'recently',
    isPending: false
  } as Connection : null;

  // Auto-gift permission checking
  const { 
    permissionResult, 
    loading: permissionLoading, 
    refreshPermission 
  } = useAutoGiftPermission(connectionForPermission);

  const handleAutoGiftToggle = async (connectionId: string, enabled: boolean) => {
    if (!connectionForPermission || !user) {
      return;
    }
    
    const result = await autoGiftPermissionService.toggleAutoGiftPermission(
      user.id, // Current logged-in user's ID 
      connectionId, // The connection being viewed
      enabled
    );
    
    if (result.success) {
      await refreshPermission();
      toast.success(`Auto-gifting ${enabled ? 'enabled' : 'disabled'} for ${connectionForPermission.name}`);
    } else {
      toast.error('Failed to update auto-gift settings. Please try again.');
    }
  };

  const handleRemoveConnection = async () => {
    if (!onRemoveConnection) return;
    
    setIsDeleting(true);
    try {
      await onRemoveConnection();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!connectionData) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            This tab is only available when viewing a connection's profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connection Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Relationship */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getRelationshipIcon(connectionData.relationship as any)}
              <span className="font-medium">
                {getRelationshipLabel(connectionData.relationship as any, connectionData.customRelationship)}
              </span>
            </div>
            <Badge variant="outline">Relationship</Badge>
          </div>

          {/* Connection Date */}
          {connectionData.connectionDate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Connected since {new Date(connectionData.connectionDate).toLocaleDateString()}</span>
              </div>
              <Badge variant="outline">Connection Date</Badge>
            </div>
          )}

          {/* Auto-Gift Toggle */}
          {permissionResult && !permissionLoading && (
            <div className="border-t pt-4">
              <AutoGiftToggle
                connectionName={profile?.name || 'User'}
                connectionId={connectionData.id || profile?.id}
                isEnabled={permissionResult.isAutoGiftEnabled}
                isLoading={permissionLoading}
                onToggle={handleAutoGiftToggle}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Birthday Countdown */}
      <BirthdayCountdown 
        userId={profile?.id} 
        connectionName={profile?.name} 
      />

      {/* Mutual Connections */}
      <MutualConnectionsSection 
        connectionId={connectionData.id || profile?.id} 
        connectionName={profile?.name} 
      />

      {/* Privacy Controls - Only show when auto-gifting is enabled */}
      {permissionResult && permissionResult.isAutoGiftEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Privacy Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectionPrivacyControls 
              connection={connectionForPermission}
              onUpdate={() => {
                // Refresh the auto-gift permission
                refreshPermission();
                // Refresh the connections data if callback provided
                onRefreshConnection?.();
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Remove Connection */}
      {connectionData.canRemoveConnection && onRemoveConnection && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Removing this connection will permanently delete your connection with {profile?.name}. 
                You'll need to send a new connection request to reconnect.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove Connection
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Connection</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {profile?.name} from your connections? 
                      This action cannot be undone and you'll need to send a new connection request to reconnect.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRemoveConnection}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Removing...' : 'Remove Connection'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConnectionTabContent;