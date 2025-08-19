import React, { useState } from "react";
import { Profile } from "@/types/profile";
import { PublicProfileData } from "@/services/publicProfileService";
import { ConnectionWithAutoGift } from "@/services/connectionService";
import ProfileBanner from "./ProfileBanner";
import ProfileTabs from "./ProfileTabs";

interface UserProfileViewProps {
  profile: Profile | PublicProfileData | null;
  connectionData?: ConnectionWithAutoGift | null;
  isOwnProfile?: boolean;
  onSendGift?: () => void;
  onRemoveConnection?: () => void;
  onRefreshConnection?: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ 
  profile, 
  connectionData, 
  isOwnProfile = true,
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
    <div className="min-h-screen bg-background">
      <ProfileBanner
        userData={profile}
        isCurrentUser={isOwnProfile}
        isConnected={!!connectionData}
        onConnect={() => {}}
        onShare={handleShare}
        connectionCount={0} // These would come from actual data
        wishlistCount={(profile as any).wishlist_count || (profile as any).wishlists?.length || 0}
        canConnect={!connectionData}
        canMessage={true}
        isAnonymousUser={false}
        connectionData={connectionData ? {
          relationship: connectionData.relationship_type,
          connectionDate: connectionData.connected_at,
          isAutoGiftEnabled: connectionData.auto_gift_enabled,
          canRemoveConnection: true
        } : undefined}
        onSendGift={onSendGift}
        onRemoveConnection={onRemoveConnection}
      />
      
      <div className="container mx-auto px-4 py-6">
        <ProfileTabs
          profile={profile}
          isOwnProfile={isOwnProfile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isPublicView={false}
          connectionData={connectionData ? {
            relationship: connectionData.relationship_type,
            connectionDate: connectionData.connected_at,
            isAutoGiftEnabled: connectionData.auto_gift_enabled,
            canRemoveConnection: true,
            id: connectionData.id
          } : undefined}
          onSendGift={onSendGift}
          onRemoveConnection={onRemoveConnection}
          onRefreshConnection={onRefreshConnection}
        />
      </div>
    </div>
  );
};

export default UserProfileView;