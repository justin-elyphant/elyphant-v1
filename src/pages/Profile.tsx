
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import ProfileTabs from "@/components/user-profile/ProfileTabs";
import ProfileBanner from "@/components/user-profile/ProfileBanner";
import ProfileInfo from "@/components/user-profile/ProfileInfo";
import SignupCTA from "@/components/user-profile/SignupCTA";
import LoadingState from "./profile-setup/LoadingState";
import Header from "@/components/home/Header";
import { Profile as ProfileType } from "@/types/profile";
import { useUserPresence } from "@/hooks/useUserPresence";
import { useSignupCTA } from "@/hooks/useSignupCTA";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const { identifier } = useParams(); // Changed from username to identifier
  const [profileData, setProfileData] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMockProfile, setIsMockProfile] = useState(false);
  const { getUserStatus } = useUserPresence();

  // Determine if this is a shared profile (not current user's profile)
  const isSharedProfile = profileData && !isCurrentUser;
  
  const { shouldShowCTA, dismissCTA } = useSignupCTA({
    profileName: profileData?.name || 'User',
    isSharedProfile: !!isSharedProfile
  });

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!identifier) {
        console.error("No identifier provided");
        setIsLoading(false);
        return;
      }

      // Check if this is a mock profile
      if (identifier.startsWith('mock-')) {
        const mockName = identifier === 'mock-1' ? 'Alex Johnson' : 
                        identifier === 'mock-2' ? 'Jamie Smith' :
                        identifier === 'mock-3' ? 'Taylor Wilson' :
                        identifier === 'mock-4' ? 'Jordan Parks' :
                        identifier === 'mock-5' ? 'Casey Morgan' :
                        identifier === 'mock-6' ? 'Sam Chen' :
                        `User ${identifier}`;
        
        const mockProfile: ProfileType = {
          id: identifier,
          name: mockName,
          email: `${mockName.toLowerCase().replace(' ', '.')}@example.com`,
          profile_image: null,
          bio: `This is a demo profile for ${mockName}. This user is part of your messaging connections.`,
          dob: null,
          shipping_address: null,
          gift_preferences: [],
          important_dates: [],
          data_sharing_settings: {
            dob: 'private',
            shipping_address: 'private',
            gift_preferences: 'friends',
            email: 'private'
          },
          username: mockName.toLowerCase().replace(' ', '_'),
          recently_viewed: [],
          interests: ['technology', 'books', 'travel']
        };
        
        setProfileData(mockProfile);
        setIsMockProfile(true);
        setIsCurrentUser(false);
        setIsLoading(false);
        return;
      }

      // Try to fetch by username first
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', identifier)
        .single();

      // If not found by username, try by ID (for backwards compatibility)
      if (error && error.code === 'PGRST116') {
        const { data: idData, error: idError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', identifier)
          .single();
        
        data = idData;
        error = idError;
      }

      if (error) {
        console.error("Error fetching profile:", error);
      }

      if (data) {
        setProfileData(data);
        setIsCurrentUser(user?.id === data.id);
        setIsMockProfile(false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [identifier, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (data: Partial<ProfileType>) => {
    setIsLoading(true);
    try {
      const { data: updatedData, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', profileData?.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
      }

      if (updatedData) {
        setProfileData(updatedData);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? "Unfollowed user" : "Following user");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profileData?.name}'s Profile`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied to clipboard");
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-muted-foreground">Profile not found</h1>
            <p className="text-muted-foreground mt-2">The user you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const userStatus = getUserStatus(profileData.id);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-4xl mx-auto py-6 px-4">
        {isMockProfile && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Demo Profile:</strong> This is a demonstration profile used for testing messaging features.
            </p>
          </div>
        )}

        {/* Profile Banner */}
        <ProfileBanner 
          userData={profileData}
          isCurrentUser={isCurrentUser}
          isFollowing={isFollowing}
          onFollow={handleFollow}
          onShare={handleShare}
          userStatus={userStatus}
        />

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:col-span-1">
            <ProfileInfo profile={profileData} />
          </div>

          {/* Main Content - Tabs */}
          <div className="lg:col-span-2">
            <ProfileTabs 
              profile={profileData}
              isOwnProfile={isCurrentUser}
              onUpdateProfile={updateProfile}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>
        </div>

        {/* Signup CTA for non-authenticated users */}
        {shouldShowCTA && (
          <SignupCTA 
            profileName={profileData.name || 'User'}
            onDismiss={dismissCTA}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
