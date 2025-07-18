
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import ProfileBanner from "@/components/user-profile/ProfileBanner";
import ProfileTabs from "@/components/user-profile/ProfileTabs";
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const { user } = useAuth();
  const { profile, loading, error, updateProfile } = useProfile();
  const [activeTab, setActiveTab] = useState("overview");

  console.log("Profile page - identifier:", identifier);
  console.log("Profile page - current user:", user?.id);
  console.log("Profile page - profile data:", profile);

  // Determine if this is the current user's own profile
  const isOwnProfile = user && profile && (
    user.id === profile.id ||
    user.email === profile.email ||
    identifier === profile.username ||
    identifier === user.id
  );

  console.log("Profile page - isOwnProfile:", isOwnProfile);

  if (loading) {
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">No Profile Data</h1>
          <p className="text-muted-foreground">Profile information is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Banner with gradient background */}
      <ProfileBanner 
        userData={profile}
        isCurrentUser={isOwnProfile || false}
        isFollowing={false}
        onFollow={() => {}}
        onShare={() => {}}
      />
      
      {/* Profile Tabs Content */}
      <div className="container mx-auto px-4 py-6">
        <ProfileTabs
          profile={profile}
          isOwnProfile={isOwnProfile || false}
          onUpdateProfile={updateProfile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
};

export default Profile;
