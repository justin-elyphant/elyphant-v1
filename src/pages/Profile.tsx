
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import ProfileBanner from "@/components/user-profile/ProfileBanner";
import ProfileTabs from "@/components/user-profile/ProfileTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useDirectFollow } from "@/hooks/useDirectFollow";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { publicProfileService, PublicProfileData } from "@/services/publicProfileService";
import SignupCTA from "@/components/user-profile/SignupCTA";
import { useSignupCTA } from "@/hooks/useSignupCTA";

const Profile = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const { user } = useAuth();
  const { profile: ownProfile, loading: ownProfileLoading, error: ownProfileError, updateProfile } = useProfile();
  
  // State for viewing other users' profiles
  const [publicProfile, setPublicProfile] = useState<PublicProfileData | null>(null);
  const [publicProfileLoading, setPublicProfileLoading] = useState(false);
  const [publicProfileError, setPublicProfileError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState("overview");

  console.log("Profile page - identifier:", identifier);
  console.log("Profile page - current user:", user?.id);

  // Determine if this is the current user's own profile
  const isOwnProfile = Boolean(user && ownProfile && (
    user.id === ownProfile.id ||
    user.email === ownProfile.email ||
    identifier === ownProfile.username ||
    identifier === user.id
  ));

  console.log("Profile page - isOwnProfile:", isOwnProfile);

  // Determine which profile data to use
  const profileData = isOwnProfile ? ownProfile : publicProfile;
  const loading = isOwnProfile ? ownProfileLoading : publicProfileLoading;
  const error = isOwnProfile ? ownProfileError : (publicProfileError ? { message: publicProfileError } : null);

  // Get follow state and counts for the profile being viewed
  const {
    followState,
    loading: followLoading,
    checkFollowStatus,
    followUser,
    unfollowUser
  } = useDirectFollow(profileData?.id);

  // Get wishlist data (only for own profile)
  const { wishlists, loading: wishlistLoading } = useWishlist();

  // Signup CTA for anonymous users
  const { shouldShowCTA, dismissCTA } = useSignupCTA({
    profileName: profileData?.name || 'this user',
    isSharedProfile: !isOwnProfile && !user
  });

  // Fetch public profile if not viewing own profile
  useEffect(() => {
    const fetchPublicProfile = async () => {
      if (!identifier) return;
      
      // If user is authenticated and this might be their own profile, wait for own profile to load
      if (user && ownProfileLoading) return;
      
      // Skip if this is definitely the user's own profile
      if (isOwnProfile) return;
      
      setPublicProfileLoading(true);
      setPublicProfileError(null);
      
      try {
        console.log("🔍 Fetching public profile for:", identifier);
        const profileData = await publicProfileService.getProfileByIdentifier(identifier);
        
        if (profileData) {
          console.log("✅ Public profile fetched:", profileData.name);
          setPublicProfile(profileData);
        } else {
          setPublicProfileError("Profile not found");
        }
      } catch (err: any) {
        console.error("Error fetching public profile:", err);
        setPublicProfileError(err.message || "Failed to load profile");
      } finally {
        setPublicProfileLoading(false);
      }
    };

    fetchPublicProfile();
  }, [identifier, isOwnProfile, user, ownProfileLoading]);

  // Fetch follow status when profile loads (only for other users' profiles)
  useEffect(() => {
    if (profileData?.id && !isOwnProfile && user) {
      checkFollowStatus();
    }
  }, [profileData?.id, isOwnProfile, user, checkFollowStatus]);

  // Calculate real counts
  const followerCount = isOwnProfile ? followState.followerCount || 0 : publicProfile?.follower_count || 0;
  const followingCount = isOwnProfile ? followState.followingCount || 0 : publicProfile?.following_count || 0;
  const wishlistCount = isOwnProfile ? wishlists.length : publicProfile?.wishlist_count || 0;

  const handleFollow = () => {
    if (followState.isFollowing) {
      unfollowUser();
    } else {
      followUser();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profileData?.name}'s Profile`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Could add a toast here
    }
  };

  if (loading || followLoading || (isOwnProfile && wishlistLoading)) {
    return (
      <div className="min-h-screen bg-background">
        {/* Banner Skeleton */}
        <div className="relative h-64 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative flex items-end justify-between p-6 h-full">
            <div className="flex items-end space-x-4">
              <Skeleton className="w-32 h-32 rounded-full bg-white/20" />
              <div className="space-y-2 pb-4">
                <Skeleton className="h-8 w-48 bg-white/20" />
                <Skeleton className="h-4 w-32 bg-white/20" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground">
            {error.message?.includes('not found') 
              ? "The profile you're looking for doesn't exist."
              : "There was an error loading the profile."
            }
          </p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">No Profile Data</h1>
          <p className="text-muted-foreground">Profile information is not available.</p>
        </div>
      </div>
    );
  }

  // Handle private profiles for non-authenticated users
  if (!isOwnProfile && publicProfile && !publicProfile.is_public) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Private Profile</h1>
          <p className="text-muted-foreground mb-4">
            This profile is private. Only the user and their connections can view it.
          </p>
          {!user && (
            <p className="text-sm text-muted-foreground">
              <a href="/signin" className="text-primary hover:underline">Sign in</a> to send a connection request.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Banner with enhanced logic for different user types */}
      <ProfileBanner 
        userData={profileData}
        isCurrentUser={isOwnProfile || false}
        isFollowing={followState.isFollowing}
        onFollow={handleFollow}
        onShare={handleShare}
        followerCount={followerCount}
        followingCount={followingCount}
        wishlistCount={wishlistCount}
        // Pass additional props for public profile handling
        canFollow={!isOwnProfile && (publicProfile?.can_follow ?? true)}
        canMessage={!isOwnProfile && (publicProfile?.can_message ?? true)}
        isAnonymousUser={!user}
      />
      
      {/* Profile Tabs Content */}
      <div className="container mx-auto px-4 py-6">
        <ProfileTabs
          profile={profileData}
          isOwnProfile={isOwnProfile || false}
          onUpdateProfile={updateProfile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isPublicView={!isOwnProfile}
        />
      </div>

      {/* Signup CTA for anonymous users */}
      {shouldShowCTA && (
        <SignupCTA
          profileName={profileData.name}
          onDismiss={dismissCTA}
        />
      )}
    </div>
  );
};

export default Profile;
