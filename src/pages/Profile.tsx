
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useProfileRetrieval } from "@/hooks/profile/useProfileRetrieval";
import { publicProfileService } from "@/services/publicProfileService";
import { useSignupCTA } from "@/hooks/useSignupCTA";
import { usePostSignupAction } from "@/hooks/usePostSignupAction";
import MainLayout from "@/components/layout/MainLayout";
import PublicProfileLayout from "@/components/layout/PublicProfileLayout";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import UserProfileView from "@/components/user-profile/UserProfileView";
import PublicProfileView from "@/components/user-profile/PublicProfileView";
import SignupCTA from "@/components/user-profile/SignupCTA";
import type { PublicProfileData } from "@/services/publicProfileService";

const Profile = () => {
  const { identifier } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { profile: ownProfile, loading: ownProfileLoading } = useProfile();
  const { profileData: fallbackProfile } = useProfileRetrieval();
  const [publicProfile, setPublicProfile] = useState<PublicProfileData | null>(null);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);

  // Enhanced debugging
  console.log("=== Profile Page Debug ===");
  console.log("URL identifier:", identifier);
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

  // If not authenticated or not own profile, treat as public profile
  const shouldLoadPublicProfile = !isOwnProfile && identifier;
  console.log("Should load public profile:", shouldLoadPublicProfile);

  // Load public profile data
  useEffect(() => {
    if (!shouldLoadPublicProfile) {
      console.log("Skipping public profile load");
      return;
    }

    const loadPublicProfile = async () => {
      console.log("Loading public profile for:", identifier);
      setIsLoadingPublic(true);
      setProfileNotFound(false);
      
      try {
        const profile = await publicProfileService.getProfileByIdentifier(identifier);
        console.log("Public profile result:", profile);
        
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

  // For authenticated users viewing their own profile - use SidebarLayout
  if (isOwnProfile) {
    console.log("Rendering own profile view");
    if (ownProfileLoading) {
      return (
        <SidebarLayout>
          <div className="container mx-auto py-10 px-4 flex-grow flex items-center justify-center">
            <div>Loading your profile...</div>
          </div>
        </SidebarLayout>
      );
    }

    return (
      <SidebarLayout>
        <UserProfileView profile={ownProfile} />
      </SidebarLayout>
    );
  }

  // For public profile views - use PublicProfileLayout for microsite experience
  if (shouldLoadPublicProfile) {
    console.log("Rendering public profile view");
    if (isLoadingPublic) {
      return (
        <PublicProfileLayout>
          <div className="container mx-auto py-10 px-4 flex-grow flex items-center justify-center min-h-[50vh]">
            <div>Loading profile...</div>
          </div>
        </PublicProfileLayout>
      );
    }

    if (profileNotFound || !publicProfile) {
      return (
        <PublicProfileLayout>
          <div className="container mx-auto py-10 px-4 flex-grow flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
              <p className="text-gray-600">The profile you're looking for doesn't exist or isn't public.</p>
            </div>
          </div>
        </PublicProfileLayout>
      );
    }

    return (
      <PublicProfileLayout>
        <PublicProfileView profile={publicProfile} />
        {shouldShowCTA && (
          <SignupCTA 
            profileName={publicProfile.name} 
            onDismiss={dismissCTA} 
          />
        )}
      </PublicProfileLayout>
    );
  }

  // Fallback - should not reach here
  console.log("Fallback case reached - redirecting to not found");
  return (
    <PublicProfileLayout>
      <div className="container mx-auto py-10 px-4 flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600">Invalid profile identifier.</p>
        </div>
      </div>
    </PublicProfileLayout>
  );
};

export default Profile;
