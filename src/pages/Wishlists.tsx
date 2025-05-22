
import React, { useState } from "react";
import BackToDashboard from "@/components/shared/BackToDashboard";
import MyWishlists from "@/components/gifting/MyWishlists";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FavoritesTabContent from "@/components/user-profile/tabs/FavoritesTabContent";
import { Heart, BookmarkCheck } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { ProductProvider } from "@/contexts/ProductContext"; // <--- Add this import

const Wishlists = () => {
  const [activeTab, setActiveTab] = useState("wishlists");

  return (
    <MainLayout>
      {/* Only wrap the content that needs product context */}
      <ProductProvider>
        <div className="container mx-auto py-8 px-4">
          <BackToDashboard />
          <h1 className="text-2xl font-bold mb-6">My Gifts</h1>
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
              <FavoritesTabContent /> 
            </TabsContent>
          </Tabs>
        </div>
      </ProductProvider>
    </MainLayout>
  );
};

export default Wishlists;

