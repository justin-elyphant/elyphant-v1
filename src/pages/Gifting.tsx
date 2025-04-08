
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
import GiftingHeader from "@/components/gifting/GiftingHeader";
import { searchProducts } from "@/components/marketplace/zinc/services/productSearchService";
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
  
  // Check if we're in a specific collection or category view
  const isSpecificView = Boolean(categoryParam || pageTitleParam);
  
  // Handle initial load and parameters
  useEffect(() => {
    console.log("URL params in Gifting:", { tabParam, categoryParam, searchParam, pageTitleParam });
    
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

  // Load products based on params
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      console.log(`Loading products for category: ${categoryParam}, search: ${searchParam}`);
      
      try {
        // First, load base products from localStorage
        const savedProducts = await loadSavedProducts();
        console.log(`Gifting page: Loaded ${savedProducts.length} products from localStorage`);
        
        // If we have a search parameter, fetch products from the Zinc API
        if (searchParam) {
          console.log(`Searching for products with term: "${searchParam}"`);
          const results = await searchProducts(searchParam, 75); // Request 75 products
          
          if (results.length > 0) {
            // Convert Zinc products to our Product format
            const zincProducts = results.map(product => convertZincProductToProduct(product));
            console.log(`Found ${zincProducts.length} products for search term "${searchParam}"`);
            
            // Combine with saved products, preserving any that don't overlap
            const combinedProducts = [
              ...savedProducts.filter(p => p.vendor !== "Amazon via Zinc"),
              ...zincProducts
            ];
            
            setInitialProducts(combinedProducts);
          } else {
            setInitialProducts(savedProducts);
          }
        } else {
          // Just use saved products if no search parameter
          setInitialProducts(savedProducts);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        // Load saved products as fallback
        const savedProducts = await loadSavedProducts();
        setInitialProducts(savedProducts);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, [categoryParam, searchParam]);

  // Custom page title for the products tab
  const productTabTitle = pageTitleParam || "Gift Ideas";

  return (
    <>
      <GiftingHeader />
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
