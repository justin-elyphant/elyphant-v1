import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { publicProfileService } from "@/services/publicProfileService";
import { connectionService } from "@/services/connectionService";
import UnifiedProfileLayout from "@/components/layout/UnifiedProfileLayout";
import ProfileShell from "@/components/user-profile/ProfileShell";
import PublicWishlistView from "@/components/gifting/wishlist/PublicWishlistView";
import type { PublicProfileData } from "@/services/publicProfileService";
import type { ConnectionProfile } from "@/services/connectionService";

const Profile: React.FC = () => {
  const { identifier } = useParams();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { profile: ownProfile, loading: ownProfileLoading } = useProfile();
  const [publicProfile, setPublicProfile] = useState<PublicProfileData | null>(null);
  const [connectionProfile, setConnectionProfile] = useState<ConnectionProfile | null>(null);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [isLoadingConnection, setIsLoadingConnection] = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);

  const context = searchParams.get('context');
  const isPreviewMode = searchParams.get('preview') === 'true';

  const isAuthenticated = Boolean(user && !authLoading);

  const isOwnProfile = isAuthenticated && ownProfile && (
    !identifier ||
    identifier === ownProfile.username ||
    identifier === user.id ||
    identifier === ownProfile.id
  );

  const isConnectionProfile = context === 'connection' && identifier && isAuthenticated && !isOwnProfile;
  const shouldLoadPublicProfile = !isOwnProfile && !isConnectionProfile && identifier;

  // Load connection profile data
  useEffect(() => {
    if (!isConnectionProfile || !user?.id || !identifier) return;

    const loadConnectionProfile = async () => {
      setIsLoadingConnection(true);
      setProfileNotFound(false);
      try {
        const profile = await connectionService.getConnectionProfile(user.id, identifier);
        if (profile) {
          setConnectionProfile(profile);
        } else {
          setProfileNotFound(true);
        }
      } catch (error) {
        console.error("Error loading connection profile:", error);
        setProfileNotFound(true);
      } finally {
        setIsLoadingConnection(false);
      }
    };

    loadConnectionProfile();
  }, [isConnectionProfile, user?.id, identifier]);

  // Load public profile data
  useEffect(() => {
    if (!shouldLoadPublicProfile) return;

    const loadPublicProfile = async () => {
      setIsLoadingPublic(true);
      setProfileNotFound(false);
      try {
        const profile = await publicProfileService.getProfileByIdentifier(identifier!);
        if (profile) {
          setPublicProfile(profile);
        } else {
          setProfileNotFound(true);
        }
      } catch (error) {
        console.error("Error loading public profile:", error);
        setProfileNotFound(true);
      } finally {
        setIsLoadingPublic(false);
      }
    };

    loadPublicProfile();
  }, [shouldLoadPublicProfile, identifier]);

  // Own profile → redirect to /wishlists
  if (!authLoading && !ownProfileLoading && isOwnProfile && !isPreviewMode) {
    return <Navigate to="/wishlists" replace />;
  }

  // Loading states
  if (authLoading) {
    return (
      <UnifiedProfileLayout isOwnProfile={false}>
        <div className="w-full py-10 px-4 flex-grow flex items-center justify-center min-h-[50vh]">
          <div>Loading...</div>
        </div>
      </UnifiedProfileLayout>
    );
  }

  if ((isConnectionProfile && isLoadingConnection) || (shouldLoadPublicProfile && isLoadingPublic)) {
    return (
      <UnifiedProfileLayout isOwnProfile={false}>
        <div className="w-full py-10 px-4 flex-grow flex items-center justify-center min-h-[50vh]">
          <div>Loading profile...</div>
        </div>
      </UnifiedProfileLayout>
    );
  }

  // Error states
  if ((isConnectionProfile && (profileNotFound || !connectionProfile)) || 
      (shouldLoadPublicProfile && (profileNotFound || !publicProfile))) {
    const errorTitle = isConnectionProfile ? "Connection Not Found" : "Profile Not Found";
    const errorMessage = isConnectionProfile 
      ? "This connection doesn't exist or you don't have access to view it."
      : "The profile you're looking for doesn't exist or isn't public.";

    return (
      <UnifiedProfileLayout isOwnProfile={false}>
        <div className="w-full py-10 px-4 flex-grow flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">{errorTitle}</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>
        </div>
      </UnifiedProfileLayout>
    );
  }

  // Public profile → unified wishlist view
  if (shouldLoadPublicProfile && publicProfile) {
    return <PublicWishlistView profile={publicProfile} />;
  }

  // Connection profile → existing ProfileShell
  if (isConnectionProfile && connectionProfile) {
    return (
      <UnifiedProfileLayout isOwnProfile={false}>
        <ProfileShell
          isOwnProfile={false}
          isConnectionProfile={true}
          connectionProfile={connectionProfile}
          onSendGift={() => console.log("Send gift clicked")}
          onRemoveConnection={() => console.log("Remove connection clicked")}
          onRefreshConnection={() => console.log("Refresh connection clicked")}
        />
      </UnifiedProfileLayout>
    );
  }

  // Fallback
  return (
    <UnifiedProfileLayout isOwnProfile={false}>
      <div className="w-full py-10 px-4 flex-grow flex items-center justify-center min-h-[50vh]">
        <div>Loading...</div>
      </div>
    </UnifiedProfileLayout>
  );
};

export default Profile;
