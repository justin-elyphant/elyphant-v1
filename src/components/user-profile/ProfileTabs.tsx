
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WishlistsTabContent from "./tabs/WishlistsTabContent";
import FavoritesTabContent from "./tabs/FavoritesTabContent";
import ActivityTabContent from "./tabs/ActivityTabContent";

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCurrentUser: boolean;
  mockWishlists: any[];
}

const ProfileTabs = ({ activeTab, setActiveTab, isCurrentUser, mockWishlists }: ProfileTabsProps) => {
  return (
    <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full">
        <TabsTrigger value="wishlists" className="flex-1">Wishlists</TabsTrigger>
        <TabsTrigger value="favorites" className="flex-1">Favorites</TabsTrigger>
        <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
      </TabsList>
      
      <TabsContent value="wishlists" className="mt-6">
        <WishlistsTabContent 
          isCurrentUser={isCurrentUser} 
          wishlists={mockWishlists} 
        />
      </TabsContent>
      
      <TabsContent value="favorites" className="mt-6">
        <FavoritesTabContent />
      </TabsContent>
      
      <TabsContent value="activity" className="mt-6">
        <ActivityTabContent />
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
