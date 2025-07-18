
import React, { useState } from "react";
import ProfileBanner from "./ProfileBanner";
import ProfileTabs from "./ProfileTabs";
import type { PublicProfileData } from "@/services/publicProfileService";

interface PublicProfileViewProps {
  profile: PublicProfileData;
}

const PublicProfileView: React.FC<PublicProfileViewProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const handleShare = () => {
    const profileUrl = window.location.origin + `/profile/${profile.username || profile.id}`;
    navigator.clipboard.writeText(profileUrl);
    // Could add a toast notification here
  };

  const handleFollow = () => {
    // This would be handled by the FollowButton component
    console.log("Follow clicked for user:", profile.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileBanner
        userData={profile}
        isCurrentUser={false}
        isFollowing={false}
        onFollow={handleFollow}
        onShare={handleShare}
        followerCount={profile.follower_count}
        followingCount={profile.following_count}
        wishlistCount={profile.wishlist_count}
        canFollow={profile.can_follow}
        canMessage={profile.can_message}
        isAnonymousUser={true} // Set to true since this is a public view
      />
      
      <div className="container mx-auto px-4 py-6">
        <ProfileTabs
          profile={profile}
          isOwnProfile={false}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isPublicView={true}
        />
      </div>
    </div>
  );
};

export default PublicProfileView;
