
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GiftingHeader from "@/components/gifting/GiftingHeader";
import MyWishlists from "@/components/gifting/MyWishlists";
import FriendsWishlists from "@/components/gifting/FriendsWishlists";
import UpcomingEvents from "@/components/gifting/UpcomingEvents";
import PopularBrands from "@/components/gifting/PopularBrands";

const Gifting = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <GiftingHeader />
      
      <main className="container mx-auto py-8 px-4">
        <Tabs defaultValue="wishlists" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="wishlists">My Wishlists</TabsTrigger>
            <TabsTrigger value="friends">Friends' Gifts</TabsTrigger>
            <TabsTrigger value="events">Upcoming Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="wishlists">
            <MyWishlists />
          </TabsContent>
          
          <TabsContent value="friends">
            <FriendsWishlists />
          </TabsContent>
          
          <TabsContent value="events">
            <UpcomingEvents />
          </TabsContent>
        </Tabs>
        
        <div className="mt-12">
          <PopularBrands />
        </div>
      </main>
    </div>
  );
};

export default Gifting;
