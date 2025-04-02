
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GiftingHeader from "@/components/gifting/GiftingHeader";
import MyWishlists from "@/components/gifting/MyWishlists";
import FriendsWishlists from "@/components/gifting/FriendsWishlists";
import UpcomingEvents from "@/components/gifting/UpcomingEvents";
import PopularBrands from "@/components/gifting/PopularBrands";
import ProductGallery from "@/components/gifting/ProductGallery";

const Gifting = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <GiftingHeader />
      
      <main className="container mx-auto py-8 px-4">
        <Tabs defaultValue="wishlists" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="wishlists">My Wishlists</TabsTrigger>
            <TabsTrigger value="friends">Friends' Gifts</TabsTrigger>
            <TabsTrigger value="events">Upcoming Events</TabsTrigger>
            <TabsTrigger value="products">Explore Products</TabsTrigger>
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
          
          <TabsContent value="products">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Gift Ideas</h2>
              <ProductGallery />
            </div>
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
