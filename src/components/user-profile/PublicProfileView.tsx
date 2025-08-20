
import React, { useState } from "react";
import ProfileTabs from "./ProfileTabs";
import { toast } from "sonner";
import type { PublicProfileData } from "@/services/publicProfileService";
import InstagramProfileLayout from "./InstagramProfileLayout";

interface PublicProfileViewProps {
  profile: PublicProfileData;
}

const PublicProfileView: React.FC<PublicProfileViewProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const handleShare = () => {
    const profileUrl = window.location.origin + `/profile/${profile.username || profile.id}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
  };

  const handleConnect = () => {
    // This would be handled by the ConnectButton component
    console.log("Connect clicked for user:", profile.id);
  };

  // Secondary content (collapsed by default)
  const secondaryContent = (
    <ProfileTabs
      profile={profile}
      isOwnProfile={false}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isPublicView={true}
    />
  );

  return (
    <InstagramProfileLayout
      userData={profile}
      profile={profile}
      isCurrentUser={false}
      isConnected={profile.is_connected}
      onConnect={handleConnect}
      onShare={handleShare}
      connectionCount={profile.connection_count || 0}
      wishlistCount={profile.wishlist_count}
      canConnect={profile.can_connect}
      canMessage={profile.can_message}
      isAnonymousUser={true}
      secondaryContent={secondaryContent}
      secondaryTitle="Profile Details"
    />
  );
};

export default PublicProfileView;
