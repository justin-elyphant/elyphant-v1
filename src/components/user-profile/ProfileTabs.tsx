
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Heart, Activity, Settings } from "lucide-react";
import { Profile } from "@/types/profile";
import WishlistsTabContent from "./tabs/WishlistsTabContent";

interface ProfileTabsProps {
  profile: Profile;
  isOwnProfile: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isPublicView: boolean;
  connectionData?: any;
  onSendGift?: () => void;
  onRemoveConnection?: () => void;
  onRefreshConnection?: () => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  profile,
  isOwnProfile,
  activeTab,
  setActiveTab,
  isPublicView,
  connectionData,
  onSendGift,
  onRemoveConnection,
  onRefreshConnection
}) => {
  console.log("🎨 ProfileTabs rendering with profile:", {
    profileId: profile?.id,
    profileName: profile?.name,
    wishlistCount: profile?.wishlist_count || profile?.wishlists?.length || 0,
    isOwnProfile,
    isPublicView,
    hasConnectionData: !!connectionData
  });

  // Get wishlists - check both possible locations
  const wishlists = profile?.wishlists || [];
  const wishlistCount = profile?.wishlist_count || wishlists.length || 0;
  
  console.log("🔢 ProfileTabs wishlist calculation:", {
    wishlistsLength: wishlists.length,
    profileWishlistCount: profile?.wishlist_count,
    finalCount: wishlistCount,
    wishlists: wishlists.map(w => ({ id: w.id, title: w.title, is_public: w.is_public }))
  });

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="wishlists" className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Wishlists ({wishlistCount})
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Activity
        </TabsTrigger>
        {isOwnProfile && (
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="overview">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {profile.name}</p>
                {profile.bio && <p><span className="font-medium">Bio:</span> {profile.bio}</p>}
                {profile.email && <p><span className="font-medium">Email:</span> {profile.email}</p>}
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Gift Preferences
              </h3>
              <div className="text-sm text-muted-foreground">
                {profile.gift_preferences && profile.gift_preferences.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {profile.gift_preferences.map((pref, index) => (
                      <li key={index}>{pref}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No gift preferences set.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="wishlists">
        <WishlistsTabContent 
          isCurrentUser={isOwnProfile} 
          wishlists={wishlists}
        />
      </TabsContent>

      <TabsContent value="activity">
        <div className="text-center py-8">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Activity feed coming soon</p>
        </div>
      </TabsContent>

      {isOwnProfile && (
        <TabsContent value="settings">
          <div className="text-center py-8">
            <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Profile settings coming soon</p>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
};

export default ProfileTabs;
