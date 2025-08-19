import React, { useState } from "react";
import { Profile } from "@/types/profile";
import ProfileBanner from "./ProfileBanner";
import ProfileTabs from "./ProfileTabs";

interface UserProfileViewProps {
  profile: Profile | null;
  connectionData?: {
    relationship?: string;
    customRelationship?: string;
    connectionDate?: string;
    isAutoGiftEnabled?: boolean;
    canRemoveConnection?: boolean;
    id?: string;
  };
  onSendGift?: () => void;
  onRemoveConnection?: () => void;
  onRefreshConnection?: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ 
  profile, 
  connectionData, 
  onSendGift, 
  onRemoveConnection, 
  onRefreshConnection 
}) => {
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
        isCurrentUser={!connectionData} // If connectionData exists, we're viewing someone else's profile
        isConnected={!!connectionData}
        onConnect={() => {}}
        onShare={handleShare}
        connectionCount={0} // These would come from actual data
        wishlistCount={profile.wishlists?.length || 0}
        canConnect={false}
        canMessage={true}
        isAnonymousUser={false}
        connectionData={connectionData}
        onSendGift={onSendGift}
        onRemoveConnection={onRemoveConnection}
      />
      
      <div className="container mx-auto px-4 py-6">
        <ProfileTabs
          profile={profile}
          isOwnProfile={!connectionData} // If connectionData exists, we're viewing someone else's profile
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isPublicView={false}
          connectionData={connectionData}
          onSendGift={onSendGift}
          onRemoveConnection={onRemoveConnection}
          onRefreshConnection={onRefreshConnection}
        />
      </div>
    </div>
  );
};

export default UserProfileView;