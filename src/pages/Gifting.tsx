
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MyWishlists from "@/components/gifting/MyWishlists";
import FriendsWishlists from "@/components/gifting/FriendsWishlists";
import UpcomingEvents from "@/components/gifting/UpcomingEvents";
import PopularBrands from "@/components/gifting/PopularBrands";
import ProductGallery from "@/components/gifting/ProductGallery";
import { ProductProvider } from "@/contexts/ProductContext";
import { useSearchParams } from "react-router-dom";
import { loadSavedProducts } from "@/components/gifting/utils/productLoader";
import { Product } from "@/contexts/ProductContext";

const Gifting = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "wishlists");
  const [initialProducts, setInitialProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Try to load products from localStorage when the component mounts
    const savedProducts = loadSavedProducts();
    if (savedProducts && savedProducts.length > 0) {
      console.log(`Gifting page: Loaded ${savedProducts.length} products from localStorage`);
      setInitialProducts(savedProducts);
    }
  }, []);

  return (
    <ProductProvider>
      <div className="container mx-auto py-8 px-4">
        <Tabs defaultValue={activeTab} className="w-full">
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
              <ProductGallery initialProducts={initialProducts} />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-12">
          <PopularBrands />
        </div>
      </div>
    </ProductProvider>
  );
};

export default Gifting;
