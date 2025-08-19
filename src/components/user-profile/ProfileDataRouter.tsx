import React from "react";
import { useUnifiedProfile } from "@/hooks/useUnifiedProfile";
import { publicProfileService } from "@/services/publicProfileService";
import MyProfilePreview from "./MyProfilePreview";
import PublicProfileView from "./PublicProfileView";
import UserProfileView from "./UserProfileView";
import type { PublicProfileData } from "@/services/publicProfileService";
import type { ConnectionProfile } from "@/services/connectionService";

interface ProfileDataRouterProps {
  isOwnProfile: boolean;
  isConnectionProfile: boolean;
  publicProfile?: PublicProfileData | null;
  connectionProfile?: ConnectionProfile | null;
  onSendGift?: () => void;
  onRemoveConnection?: () => void;
  onRefreshConnection?: () => void;
}

/**
 * PROFILE DATA ROUTER
 * 
 * Intelligent routing component that renders the appropriate profile view based on context:
 * - Own profile → MyProfilePreview (social proof dashboard)
 * - Connection profile → Enhanced UserProfileView with connection features
 * - Public profile → PublicProfileView (conversion-optimized)
 */
const ProfileDataRouter: React.FC<ProfileDataRouterProps> = ({
  isOwnProfile,
  isConnectionProfile,
  publicProfile,
  connectionProfile,
  onSendGift,
  onRemoveConnection,
  onRefreshConnection
}) => {
  const { profile: ownProfile, loading: ownProfileLoading } = useUnifiedProfile();

  // Loading state for own profile
  if (isOwnProfile && ownProfileLoading) {
    return (
      <div className="container mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <div>Loading your profile preview...</div>
      </div>
    );
  }

  // Own profile - render the social proof dashboard
  if (isOwnProfile) {
    return (
      <MyProfilePreview 
        profile={ownProfile} 
      />
    );
  }

  // Connection profile - render enhanced profile view
  if (isConnectionProfile && connectionProfile) {
    return (
      <UserProfileView 
        profile={connectionProfile.profile} 
        connectionData={connectionProfile.connectionData}
        onSendGift={onSendGift}
        onRemoveConnection={onRemoveConnection}
        onRefreshConnection={onRefreshConnection}
      />
    );
  }

  // Public profile - render conversion-optimized view
  if (publicProfile) {
    return (
      <PublicProfileView profile={publicProfile} />
    );
  }

  // Fallback - should not reach here
  return (
    <div className="container mx-auto py-10 px-4 flex-grow flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground">Unable to load profile data.</p>
      </div>
    </div>
  );
};

export default ProfileDataRouter;