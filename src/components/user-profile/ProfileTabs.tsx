
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WishlistsTabContent from "./tabs/WishlistsTabContent";
import FavoritesTabContent from "./tabs/FavoritesTabContent";
import ActivityTabContent from "./tabs/ActivityTabContent";

export interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCurrentUser: boolean;
  mockWishlists: any[];
}

const ProfileTabs = ({ activeTab, setActiveTab, isCurrentUser, mockWishlists }: ProfileTabsProps) => {
  return (
    <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="wishlists">Wishlists</TabsTrigger>
        <TabsTrigger value="favorites">Saved Items</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      
      <TabsContent value="wishlists" className="mt-6">
        <WishlistsTabContent 
          isCurrentUser={isCurrentUser} 
          wishlists={mockWishlists} 
        />
      </TabsContent>
      
      <TabsContent value="favorites" className="mt-6">
        <FavoritesTabContent isCurrentUser={isCurrentUser} />
      </TabsContent>
      
      <TabsContent value="activity" className="mt-6">
        <ActivityTabContent />
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
