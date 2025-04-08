
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MyWishlists from "@/components/gifting/MyWishlists";
import FriendsWishlists from "@/components/gifting/FriendsWishlists";
import UpcomingEvents from "@/components/gifting/UpcomingEvents";
import PopularBrands from "@/components/gifting/PopularBrands";
import ProductGallery from "@/components/gifting/ProductGallery";
import { ProductProvider } from "@/contexts/ProductContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadSavedProducts } from "@/components/gifting/utils/productLoader";
import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";

const Gifting = () => {
  return (
    <ProductProvider>
      <GiftingWrapper />
    </ProductProvider>
  );
};

const GiftingWrapper = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("wishlists");
  const [initialProducts, setInitialProducts] = useState<Product[]>([]);
  
  // Handle initial load and parameters
  useEffect(() => {
    console.log("URL params in Gifting:", { tabParam, categoryParam, searchParam });
    
    // Priority handling: If category or search is present, switch to products tab 
    if (categoryParam || searchParam) {
      console.log("Category or search param detected, switching to products tab");
      setActiveTab("products");
      
      // If we don't have tab=products in URL, add it
      if (tabParam !== "products") {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("tab", "products");
        navigate(`?${newParams.toString()}`, { replace: true });
      }
    } 
    else if (tabParam && ["wishlists", "friends", "events", "products"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, categoryParam, searchParam, navigate, searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Preserve any category parameter when changing tabs
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    navigate(`?${newParams.toString()}`, { replace: true });
    
    // Show indicator if there's an active category or search when switching tabs
    if (value !== "products" && (categoryParam || searchParam)) {
      toast.info("Your search filters will be preserved when returning to Products tab");
    }
  };

  useEffect(() => {
    const savedProducts = loadSavedProducts();
    if (savedProducts && savedProducts.length > 0) {
      console.log(`Gifting page: Loaded ${savedProducts.length} products from localStorage`);
      setInitialProducts(savedProducts);
    }
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
  );
};

export default Gifting;
