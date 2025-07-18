import React, { useState } from "react";
import { Profile } from "@/types/profile";
import ProfileBanner from "./ProfileBanner";
import ProfileTabs from "./ProfileTabs";

interface UserProfileViewProps {
  profile: Profile | null;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!profile) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">Unable to load your profile data.</p>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    const profileUrl = window.location.origin + `/profile/${profile.username || profile.id}`;
    navigator.clipboard.writeText(profileUrl);
    // Could add a toast notification here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileBanner
        userData={profile}
        isCurrentUser={true}
        isFollowing={false}
        onFollow={() => {}}
        onShare={handleShare}
        followerCount={0} // These would come from actual data
        followingCount={0}
        wishlistCount={profile.wishlists?.length || 0}
        canFollow={false}
        canMessage={false}
        isAnonymousUser={false}
      />
      
      <div className="container mx-auto px-4 py-6">
        <ProfileTabs
          profile={profile}
          isOwnProfile={true}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isPublicView={false}
        />
      </div>
    </div>
  );
};

export default UserProfileView;