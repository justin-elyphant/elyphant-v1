import React, { useState } from "react";
import { ShoppingBag } from "lucide-react";
import BackToDashboard from "@/components/shared/BackToDashboard";
import MyWishlists from "@/components/gifting/MyWishlists";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FavoritesTabContent from "@/components/user-profile/tabs/FavoritesTabContent";
import { Heart, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Wishlists = () => {
  const [activeTab, setActiveTab] = useState("wishlists");

  return (
    <div className="container mx-auto py-8 px-4">
      <BackToDashboard />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Gifts</h1>
        <Button variant="outline" asChild>
          <Link to="/marketplace">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Shop Marketplace
          </Link>
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md mb-6">
          <TabsTrigger value="wishlists" className="flex items-center">
            <BookmarkCheck className="h-4 w-4 mr-2" />
            My Wishlists
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center">
            <Heart className="h-4 w-4 mr-2" />
            Saved Items
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="wishlists">
          <MyWishlists />
        </TabsContent>
        
        <TabsContent value="favorites">
          <FavoritesTabContent isCurrentUser={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Wishlists;
