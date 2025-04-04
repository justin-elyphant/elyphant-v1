
import React from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockWishlists.map(wishlist => (
            <Card key={wishlist.id} className="overflow-hidden">
              <div 
                className="h-36 bg-cover bg-center"
                style={{ backgroundImage: `url(${wishlist.image})` }}
              />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{wishlist.title}</CardTitle>
                <CardDescription>{wishlist.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{wishlist.itemCount} items</span>
                  <Button variant="ghost" size="sm">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {isCurrentUser && (
            <Card className="flex items-center justify-center h-full border-dashed">
              <CardContent className="py-8">
                <Button variant="outline" asChild>
                  <Link to="/wishlists/create">
                    Create New Wishlist
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="favorites" className="mt-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
          <p className="text-muted-foreground mb-4">When you find products you love, save them here for later.</p>
          <Button asChild>
            <Link to="/marketplace">Explore Marketplace</Link>
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="activity" className="mt-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Activity feed coming soon</h3>
          <p className="text-muted-foreground">We're working on an activity feed to show your interactions.</p>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
