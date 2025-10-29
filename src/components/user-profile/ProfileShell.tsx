import React, { useState } from "react";
import { toast } from "sonner";
import MyProfilePreview from "./MyProfilePreview";
import InstagramProfileLayout from "./InstagramProfileLayout";
import ProfileTabs from "./ProfileTabs";
import ProfileSharingDialog from "./ProfileSharingDialog";
import { useProfileSharing } from "@/hooks/useProfileSharing";
import type { PublicProfileData } from "@/services/publicProfileService";
import type { ConnectionProfile } from "@/services/connectionService";

interface ProfileShellProps {
  isOwnProfile: boolean;
  isConnectionProfile: boolean;
  publicProfile?: PublicProfileData | null;
  connectionProfile?: ConnectionProfile | null;
  ownProfile?: any;
  isPreviewMode?: boolean;
  onSendGift?: () => void;
  onRemoveConnection?: () => void;
  onRefreshConnection?: () => void;
}

/**
 * PROFILE SHELL
 * 
 * Consolidated profile rendering component that replaces ProfileDataRouter
 * and eliminates the multiple view component layers. Renders profiles directly
 * with appropriate layouts based on profile type.
 */
const ProfileShell: React.FC<ProfileShellProps> = ({
  isOwnProfile,
  isConnectionProfile,
  publicProfile,
  connectionProfile,
  ownProfile,
  isPreviewMode = false,
  onSendGift,
  onRemoveConnection,
  onRefreshConnection
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Enhanced sharing for connection profiles
  const connectionSharing = useProfileSharing({
    profileId: connectionProfile?.profile?.id || '',
    profileName: connectionProfile?.profile?.name || 'User',
    profileUsername: connectionProfile?.profile?.username
  });

  // Enhanced sharing for public profiles
  const publicSharing = useProfileSharing({
    profileId: publicProfile?.id || '',
    profileName: publicProfile?.name || 'User',
    profileUsername: publicProfile?.username
  });

  // Own profile - render the social proof dashboard
  if (isOwnProfile && ownProfile) {
    return (
      <div className="w-full" style={{ width: '100%', maxWidth: 'none' }}>
        <MyProfilePreview profile={ownProfile} isPreviewMode={isPreviewMode} />
      </div>
    );
  }

  // Connection profile - render enhanced profile view with connection features  
  if (isConnectionProfile && connectionProfile) {
    const handleShare = () => {
      // Use enhanced sharing - mobile gets native share, desktop gets dialog
      if (navigator.share) {
        connectionSharing.quickShare();
      } else {
        connectionSharing.openSharingDialog();
      }
    };

    const handleConnect = () => {
      console.log("Connect clicked for user:", connectionProfile.profile.id);
    };

    return (
      <div className="w-full" style={{ width: '100%', maxWidth: 'none' }}>
        <InstagramProfileLayout
          userData={connectionProfile.profile}
          profile={connectionProfile.profile}
          isCurrentUser={false}
          isConnected={true}
          onConnect={handleConnect}
          onShare={handleShare}
          connectionCount={0}
          wishlistCount={0}
          canConnect={false}
          canMessage={true}
          isAnonymousUser={false}
          connectionData={connectionProfile.connectionData}
          onSendGift={onSendGift}
          onRemoveConnection={onRemoveConnection}
        />
        
        {/* Enhanced Profile Sharing Dialog */}
        <ProfileSharingDialog
          open={connectionSharing.sharingDialogOpen}
          onOpenChange={connectionSharing.closeSharingDialog}
          profileUrl={connectionSharing.profileUrl}
          profileName={connectionProfile.profile.name || 'User'}
          profileUsername={connectionProfile.profile.username}
        />
      </div>
    );
  }

  // Public profile - render conversion-optimized Instagram-style layout
  if (publicProfile) {
    const handleShare = () => {
      // Use enhanced sharing - mobile gets native share, desktop gets dialog
      if (navigator.share) {
        publicSharing.quickShare();
      } else {
        publicSharing.openSharingDialog();
      }
    };

    const handleConnect = () => {
      console.log("Connect clicked for user:", publicProfile.id);
    };

    // Secondary content (collapsed by default)
    const secondaryContent = (
      <ProfileTabs
        profile={publicProfile}
        isOwnProfile={false}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPublicView={true}
      />
    );

    return (
      <div className="w-full" style={{ width: '100%', maxWidth: 'none' }}>
        <InstagramProfileLayout
          userData={publicProfile}
          profile={publicProfile}
          isCurrentUser={false}
          isConnected={publicProfile.is_connected}
          onConnect={handleConnect}
          onShare={handleShare}
          connectionCount={publicProfile.connection_count || 0}
          wishlistCount={publicProfile.wishlist_count}
          canConnect={publicProfile.can_connect}
          canMessage={publicProfile.can_message}
          isAnonymousUser={true}
          secondaryContent={secondaryContent}
          secondaryTitle="Profile Details"
        />
        
        {/* Enhanced Profile Sharing Dialog */}
        <ProfileSharingDialog
          open={publicSharing.sharingDialogOpen}
          onOpenChange={publicSharing.closeSharingDialog}
          profileUrl={publicSharing.profileUrl}
          profileName={publicProfile.name || 'User'}
          profileUsername={publicProfile.username}
        />
      </div>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="w-full py-10 px-4 flex-grow flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground">Unable to load profile data.</p>
      </div>
    </div>
  );
};

export default ProfileShell;