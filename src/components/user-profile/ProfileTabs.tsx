
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTabContent from "./tabs/OverviewTabContent";
import WishlistTabContent from "./tabs/WishlistTabContent";
import SettingsTabContent from "./tabs/SettingsTabContent";
import ActivityTabContent from "./tabs/ActivityTabContent";
import ConnectTabContent from "./tabs/ConnectTabContent";
import { RecentlyViewedItem } from "@/types/profile";
import { Profile } from "@/types/profile";

export interface ProfileTabsProps {
  profile: any;
  isOwnProfile: boolean;
  onUpdateProfile?: (data: Partial<Profile>) => Promise<void>;
  // Add the props that were causing errors
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  mockWishlists?: any[];
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ 
  profile, 
  isOwnProfile, 
  onUpdateProfile,
  activeTab = "overview",
  setActiveTab
}) => {
  // Get recently viewed items from profile or set empty array
  const recentlyViewed: RecentlyViewedItem[] = profile?.recently_viewed || [];
  
  const handleTabChange = (value: string) => {
    if (setActiveTab) {
      setActiveTab(value);
    }
  };

  // Create a wrapped update function that returns a Promise
  const handleUpdateProfile = async (data: Partial<Profile>): Promise<void> => {
    if (onUpdateProfile) {
      return Promise.resolve(onUpdateProfile(data));
    }
    return Promise.resolve();
  };

  return (
    <Tabs 
      defaultValue={activeTab} 
      className="w-full"
      onValueChange={handleTabChange}
    >
      <TabsList className="grid grid-cols-5 md:w-auto w-full">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
        <TabsTrigger value="activity">
          Activity
          {recentlyViewed.length > 0 && (
            <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full h-5 w-5 inline-flex items-center justify-center">
              {recentlyViewed.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="connect">Connect</TabsTrigger>
        {isOwnProfile && <TabsTrigger value="settings">Settings</TabsTrigger>}
      </TabsList>

      <TabsContent value="overview">
        <OverviewTabContent profile={profile} isOwnProfile={isOwnProfile} />
      </TabsContent>

      <TabsContent value="wishlist">
        <WishlistTabContent profile={profile} isOwnProfile={isOwnProfile} />
      </TabsContent>

      <TabsContent value="activity">
        <ActivityTabContent 
          profile={profile} 
          recentlyViewed={recentlyViewed} 
          isOwnProfile={isOwnProfile} 
        />
      </TabsContent>

      <TabsContent value="connect">
        <ConnectTabContent profile={profile} isOwnProfile={isOwnProfile} />
      </TabsContent>

      {isOwnProfile && (
        <TabsContent value="settings">
          <SettingsTabContent 
            profile={profile} 
            onUpdateProfile={handleUpdateProfile} 
          />
        </TabsContent>
      )}
    </Tabs>
  );
};

export default ProfileTabs;
