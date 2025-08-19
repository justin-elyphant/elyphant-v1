
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useProfileRetrieval } from "@/hooks/profile/useProfileRetrieval";
import { publicProfileService } from "@/services/publicProfileService";
import { connectionService } from "@/services/connectionService";
import { useSignupCTA } from "@/hooks/useSignupCTA";
import { usePostSignupAction } from "@/hooks/usePostSignupAction";
import MainLayout from "@/components/layout/MainLayout";
import PublicProfileLayout from "@/components/layout/PublicProfileLayout";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import UserProfileView from "@/components/user-profile/UserProfileView";
import PublicProfileView from "@/components/user-profile/PublicProfileView";
import SignupCTA from "@/components/user-profile/SignupCTA";
import ProfileDataRouter from "@/components/user-profile/ProfileDataRouter";
import type { PublicProfileData } from "@/services/publicProfileService";
import type { ConnectionProfile } from "@/services/connectionService";

const Profile = () => {
  const { identifier } = useParams();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { profile: ownProfile, loading: ownProfileLoading } = useProfile();
  const { profileData: fallbackProfile } = useProfileRetrieval();
  const [publicProfile, setPublicProfile] = useState<PublicProfileData | null>(null);
  const [connectionProfile, setConnectionProfile] = useState<ConnectionProfile | null>(null);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [isLoadingConnection, setIsLoadingConnection] = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);

  const context = searchParams.get('context');

  // Enhanced debugging
  console.log("=== Profile Page Debug ===");
  console.log("URL identifier:", identifier);
  console.log("Context:", context);
  console.log("Auth state:", { 
    hasUser: !!user, 
    userId: user?.id, 
    userEmail: user?.email,
    authLoading 
  });
  console.log("Own profile:", { 
    hasOwnProfile: !!ownProfile, 
    ownProfileId: ownProfile?.id,
    ownProfileUsername: ownProfile?.username,
    ownProfileLoading 
  });

  // Strict authentication check - only consider authenticated if we have both user and session
  const isAuthenticated = Boolean(user && !authLoading);
  console.log("Is authenticated:", isAuthenticated);

  // Determine if this is the user's own profile
  // If no identifier, it's the user's own profile (authenticated user visiting /profile)
  // If there is an identifier, check if it matches the user's profile
  const isOwnProfile = isAuthenticated && ownProfile && (
    !identifier || // No identifier means user's own profile
    identifier === ownProfile.username ||
    identifier === user.id ||
    identifier === ownProfile.id
  );

  console.log("Is own profile:", isOwnProfile);

  // Determine profile viewing mode
  const isConnectionProfile = context === 'connection' && identifier && isAuthenticated && !isOwnProfile;
  const shouldLoadPublicProfile = !isOwnProfile && !isConnectionProfile && identifier;
  
  console.log("Is connection profile:", isConnectionProfile);
  console.log("Should load public profile:", shouldLoadPublicProfile);

  // Load connection profile data
  useEffect(() => {
    if (!isConnectionProfile || !user?.id || !identifier) {
      console.log("Skipping connection profile load", { isConnectionProfile, userId: user?.id, identifier });
      return;
    }

    const loadConnectionProfile = async () => {
      console.log("🔄 Loading connection profile for:", identifier, "by user:", user.id);
      setIsLoadingConnection(true);
      setProfileNotFound(false);
      
      try {
        const profile = await connectionService.getConnectionProfile(user.id, identifier);
        console.log("✅ Connection profile result:", profile);
        
        if (profile) {
          setConnectionProfile(profile);
          console.log("🎉 Connection profile loaded successfully:", {
            profileName: profile.profile.name,
            relationship: profile.connectionData.relationship,
            autoGiftEnabled: profile.connectionData.isAutoGiftEnabled
          });
        } else {
          console.log("❌ Connection profile not found or no access");
          setProfileNotFound(true);
        }
      } catch (error) {
        console.error("💥 Error loading connection profile:", error);
        setProfileNotFound(true);
      } finally {
        setIsLoadingConnection(false);
      }
    };

    loadConnectionProfile();
  }, [isConnectionProfile, user?.id, identifier]);

  // Load public profile data
  useEffect(() => {
    console.log("🎬 Profile useEffect triggered - shouldLoadPublicProfile:", shouldLoadPublicProfile);
    console.log("🎬 Current state - identifier:", identifier, "publicProfile:", !!publicProfile);
    
    if (!shouldLoadPublicProfile) {
      console.log("❌ Skipping public profile load - shouldLoadPublicProfile is false");
      return;
    }

    const loadPublicProfile = async () => {
      console.log("🚀 Starting to load public profile for:", identifier);
      setIsLoadingPublic(true);
      setProfileNotFound(false);
      
      try {
        const profile = await publicProfileService.getProfileByIdentifier(identifier);
        console.log("📦 Public profile service returned:", profile);
        
        if (profile) {
          console.log("✅ Setting public profile with wishlist_count:", profile.wishlist_count);
          setPublicProfile(profile);
        } else {
          console.log("❌ No profile returned, setting not found");
          setProfileNotFound(true);
        }
      } catch (error) {
        console.error("💥 Error loading public profile:", error);
        setProfileNotFound(true);
      } finally {
        setIsLoadingPublic(false);
      }
    };

    loadPublicProfile();
  }, [shouldLoadPublicProfile, identifier]);

  // Signup CTA logic - only show for public profiles when not authenticated
  const { shouldShowCTA, dismissCTA } = useSignupCTA({
    profileName: publicProfile?.name || "this user",
    isSharedProfile: !isAuthenticated && !!publicProfile
  });

  // Post-signup action handling
  usePostSignupAction();

  // Loading states
  if (authLoading) {
    console.log("Showing auth loading state");
    return (
      <PublicProfileLayout>
        <div className="container mx-auto py-10 px-4 flex-grow flex items-center justify-center min-h-[50vh]">
          <div>Loading...</div>
        </div>
      </PublicProfileLayout>
    );
  }

  // Unified profile routing using ProfileDataRouter
  const layoutComponent = isOwnProfile ? SidebarLayout : PublicProfileLayout;
  const Layout = layoutComponent;

  // Handle loading states
  if ((isOwnProfile && ownProfileLoading) || (isConnectionProfile && isLoadingConnection) || (shouldLoadPublicProfile && isLoadingPublic)) {
    const loadingMessage = isOwnProfile 
      ? "Loading your profile preview..." 
      : isConnectionProfile 
        ? "Loading connection profile..."
        : "Loading profile...";

    return (
      <Layout>
        <div className="container mx-auto py-10 px-4 flex-grow flex items-center justify-center min-h-[50vh]">
          <div>{loadingMessage}</div>
        </div>
      </Layout>
    );
  }

  // Handle error states
  if ((isConnectionProfile && (profileNotFound || !connectionProfile)) || 
      (shouldLoadPublicProfile && (profileNotFound || !publicProfile))) {
    const errorTitle = isConnectionProfile ? "Connection Not Found" : "Profile Not Found";
    const errorMessage = isConnectionProfile 
      ? "This connection doesn't exist or you don't have access to view it."
      : "The profile you're looking for doesn't exist or isn't public.";

    return (
      <Layout>
        <div className="container mx-auto py-10 px-4 flex-grow flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{errorTitle}</h1>
            <p className="text-gray-600">{errorMessage}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Render the appropriate profile view using ProfileDataRouter
  return (
    <Layout>
      <ProfileDataRouter
        isOwnProfile={isOwnProfile}
        isConnectionProfile={isConnectionProfile}
        publicProfile={publicProfile}
        connectionProfile={connectionProfile}
      />
      {/* Show signup CTA for public profiles when not authenticated */}
      {shouldLoadPublicProfile && shouldShowCTA && publicProfile && (
        <SignupCTA 
          profileName={publicProfile.name} 
          onDismiss={dismissCTA} 
        />
      )}
    </Layout>
  );

};

export default Profile;
