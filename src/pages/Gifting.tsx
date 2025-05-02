
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
import { Product } from "@/types/product";
import { toast } from "sonner";
import GiftingHeader from "@/components/gifting/GiftingHeader";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { convertZincProductToProduct } from "@/components/marketplace/zinc/utils/productConverter";

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
  const pageTitleParam = searchParams.get("pageTitle");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("wishlists");
  const [initialProducts, setInitialProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const isSpecificView = Boolean(categoryParam || pageTitleParam);
  
  useEffect(() => {
    console.log("URL params in Gifting:", { tabParam, categoryParam, searchParam, pageTitleParam });
    
    if (categoryParam || searchParam) {
      console.log("Category or search param detected, switching to products tab");
      setActiveTab("products");
      
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

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      console.log(`Loading products for category: ${categoryParam}, search: ${searchParam}`);
      
      try {
        const savedProducts = await loadSavedProducts();
        console.log(`Gifting page: Loaded ${savedProducts.length} products from localStorage`);
        
        if (searchParam) {
          console.log(`Searching for products with term: "${searchParam}"`);
          
          toast.loading(`Searching for ${searchParam}...`, { id: "product-search" });
          
          const results = await searchProducts(searchParam, "75");
          
          toast.dismiss("product-search");
          
          if (results.length > 0) {
            const zincProducts = results.map(product => convertZincProductToProduct(product));
            console.log(`Found ${zincProducts.length} products for search term "${searchParam}"`);
            toast.success(`Found ${zincProducts.length} products for "${searchParam}"`);
            
            const combinedProducts = [
              ...savedProducts.filter(p => p.vendor !== "Amazon via Zinc"),
              ...zincProducts
            ];
            
            setInitialProducts(combinedProducts);
          } else {
            console.log(`No products found for "${searchParam}"`);
            toast.error(`No products found for "${searchParam}". Showing available products instead.`);
            setInitialProducts(savedProducts);
          }
        } else {
          setInitialProducts(savedProducts);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Error searching for products. Showing available products instead.");
        const savedProducts = await loadSavedProducts();
        setInitialProducts(savedProducts);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, [categoryParam, searchParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    navigate(`?${newParams.toString()}`, { replace: true });
    
    if (value !== "products" && (categoryParam || searchParam)) {
      toast.info("Your search filters will be preserved when returning to Products tab");
    }
  };

  const productTabTitle = pageTitleParam || "Gift Ideas";

  return (
    <>
      {!isSpecificView && <GiftingHeader />}
      <div className="container mx-auto py-8 px-4">
        {!isSpecificView && (
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
                <h2 className="text-2xl font-bold">{productTabTitle}</h2>
                <ProductGallery initialProducts={initialProducts} />
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        {isSpecificView && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{productTabTitle}</h2>
            <ProductGallery initialProducts={initialProducts} />
          </div>
        )}
        
        <div className="mt-12">
          <PopularBrands />
        </div>
      </div>
    </>
  );
};

export default Gifting;
