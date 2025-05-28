
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import ProfileTabs from "@/components/user-profile/ProfileTabs";
import ProfileBanner from "@/components/user-profile/ProfileBanner";
import ProfileInfo from "@/components/user-profile/ProfileInfo";
import LoadingState from "./profile-setup/LoadingState";
import Header from "@/components/home/Header";
import { Profile as ProfileType } from "@/types/profile";
import { useUserPresence } from "@/hooks/useUserPresence";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const { username } = useParams();
  const [profileData, setProfileData] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);
  const { getUserStatus } = useUserPresence();

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      }

      if (data) {
        setProfileData(data);
        setIsCurrentUser(user?.id === data.id);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [username, user?.id]);

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
      </div>
    </div>
  );
};

export default Profile;
