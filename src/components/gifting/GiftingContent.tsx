
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductGallery from "./ProductGallery";
import FriendsWishlists from "./FriendsWishlists";
import UpcomingEvents from "./UpcomingEvents";

const GiftingContent = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gift Discovery</h1>
        <p className="text-gray-600 mt-2">
          Find the perfect gifts for your friends and loved ones
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Browse Gifts</TabsTrigger>
          <TabsTrigger value="wishlists">Friends' Wishlists</TabsTrigger>
          <TabsTrigger value="events">Upcoming Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-6">
          <ProductGallery />
        </TabsContent>
        
        <TabsContent value="wishlists" className="mt-6">
          <FriendsWishlists />
        </TabsContent>
        
        <TabsContent value="events" className="mt-6">
          <UpcomingEvents />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GiftingContent;
