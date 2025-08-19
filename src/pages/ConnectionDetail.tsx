import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Gift, UserMinus, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useAuth } from "@/contexts/auth";
import { useConnection } from "@/hooks/useConnection";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import { getRelationshipIcon, getRelationshipLabel } from "@/components/connections/RelationshipUtils";

import { ConnectionPrivacyControls } from "@/components/connections/ConnectionPrivacyControls";
import { AutoGiftStatusBadge } from "@/components/connections/AutoGiftStatusBadge";
import { AutoGiftToggle } from "@/components/connections/AutoGiftToggle";
import { PublicWishlistsSection } from "@/components/connections/PublicWishlistsSection";
import { BirthdayCountdown } from "@/components/connections/BirthdayCountdown";
import { MutualConnectionsSection } from "@/components/connections/MutualConnectionsSection";
import { useAutoGiftPermission } from "@/hooks/useAutoGiftPermission";
import { autoGiftPermissionService } from "@/services/autoGiftPermissionService";
import { toast } from "@/hooks/use-toast";

const ConnectionDetail: React.FC = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get the current logged-in user
  const { connection, loading, error } = useConnection(connectionId || "");
  const { handleDeleteConnection, refreshPendingConnections: refreshConnections } = useConnectionsAdapter();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Auto-gift permission checking
  const { 
    permissionResult, 
    loading: permissionLoading, 
    refreshPermission 
  } = useAutoGiftPermission(connection);

  const handleAutoGiftToggle = async (connectionId: string, enabled: boolean) => {
    if (!connection || !user) {
      return;
    }
    
    const result = await autoGiftPermissionService.toggleAutoGiftPermission(
      user.id, // Current logged-in user's ID 
      connectionId, // The connection being viewed
      enabled
    );
    
    if (result.success) {
      await refreshPermission();
      toast.success(`Auto-gifting ${enabled ? 'enabled' : 'disabled'} for ${connection.name}`);
    } else {
      toast.error('Failed to update auto-gift settings. Please try again.');
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !connection) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connection Not Found</h1>
          <p className="text-gray-600 mb-6">The connection you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/connections">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Connections
            </Link>
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link to="/connections">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Connections
            </Link>
          </Button>
        </div>

        {/* Profile Card */}
        {/* Profile Card */}
          <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={connection.imageUrl} alt={connection.name} />
                <AvatarFallback className="text-2xl">{connection.name.charAt(0)}</AvatarFallback>
              </Avatar>
               <div className="flex-1">
                 <div className="flex items-center gap-2">
                   <CardTitle className="text-2xl">{connection.name}</CardTitle>
                   {/* Auto-Gift Status Badge - Next to name like a verified badge */}
                   {permissionResult && !permissionLoading && (
                     <AutoGiftStatusBadge status={permissionResult.status} className="text-[10px] px-1.5 py-0.5 h-4" />
                   )}
                 </div>
                 <p className="text-muted-foreground">@{connection.username}</p>
                <div className="flex items-center mt-2 gap-2">
                  <div className="flex items-center">
                    {getRelationshipIcon(connection.relationship)}
                    <span className="ml-1 text-sm font-medium">
                      {getRelationshipLabel(connection.relationship, connection.customRelationship)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {/* Action Buttons Row */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/profile/${connection.id}`}>
                      <User className="w-4 h-4 mr-2" />
                      View Profile
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to={`/messages/${connection.id}`}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Gift className="w-4 h-4 mr-2" />
                    Send Gift
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remove Connection
                      </Button>
                    </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Connection</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove {connection.name} from your connections? 
                        This action cannot be undone and you'll need to send a new connection request to reconnect.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          setIsDeleting(true);
                          const success = await handleDeleteConnection(connection.id);
                          if (success) {
                            navigate('/connections');
                          }
                          setIsDeleting(false);
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Removing...' : 'Remove Connection'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                </div>
                
                {/* Auto-Gift Toggle Row */}
                {permissionResult && !permissionLoading && (
                  <AutoGiftToggle
                    connectionName={connection.name}
                    connectionId={connection.id}
                    isEnabled={permissionResult.isAutoGiftEnabled}
                    isLoading={permissionLoading}
                    onToggle={handleAutoGiftToggle}
                    className="border-t pt-3 mt-1"
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {connection.bio && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">About</h3>
                <p className="text-muted-foreground">{connection.bio}</p>
              </div>
            )}
            
            {connection.interests && connection.interests.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {connection.interests.map(interest => (
                    <Badge key={interest} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">{connection.mutualFriends}</span> mutual connections
              </div>
              <div>
                Connected since {connection.connectionDate ? new Date(connection.connectionDate).toLocaleDateString() : 'Unknown'}
              </div>
              <div>
                Last active: {connection.lastActive}
              </div>
            </div>
          </CardContent>
          </Card>

        {/* Dynamic Content Sections */}
        <div className="space-y-6 mb-6">
          {/* Birthday Countdown - Full width when shown */}
          <BirthdayCountdown 
            userId={connection.id} 
            connectionName={connection.name} 
          />
          
          {/* Two-column layout for other sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Public Wishlists */}
            <PublicWishlistsSection 
              userId={connection.id} 
              connectionName={connection.name} 
            />
            
            {/* Mutual Connections */}
            <MutualConnectionsSection 
              connectionId={connection.id} 
              connectionName={connection.name} 
            />
          </div>
        </div>

        {/* Privacy Controls Section - Only show when auto-gifting is enabled */}
        {permissionResult && permissionResult.isAutoGiftEnabled && (
          <Card>
            <CardHeader>
              <CardTitle>Privacy Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <ConnectionPrivacyControls 
                connection={connection}
                onUpdate={() => {
                  // Refresh the auto-gift permission
                  refreshPermission();
                  // Refresh the connections data
                  refreshConnections();
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
};

export default ConnectionDetail;