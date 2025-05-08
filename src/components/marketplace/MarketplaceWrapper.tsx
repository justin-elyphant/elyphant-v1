
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { searchMockProducts } from "./services/mockProductService";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

import MarketplaceHeader from "./MarketplaceHeader";
import GiftingCategories from "./GiftingCategories";
import MarketplaceContent from "./MarketplaceContent";
import RecentlyViewedProducts from "./RecentlyViewedProducts";
import { Product } from "@/types/product";
import { normalizeProduct } from "@/contexts/ProductContext";
import { toast } from "sonner";

// Track search operations to prevent duplicate toast notifications
const searchOperations = new Map();

const MarketplaceWrapper = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const { profile } = useProfile();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const searchIdRef = useRef<string>("");
  
  // Initial load based on URL search parameter
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearchTerm(searchParam);
      const personId = searchParams.get("personId");
      const occasionType = searchParams.get("occasionType");
      
      // Generate unique ID for this search to prevent duplicate toasts
      const searchId = `search-${searchParam}-${Date.now()}`;
      searchIdRef.current = searchId;
      
      handleSearch(searchParam, personId, occasionType);
    } else {
      // Load some default products with personalization
      loadPersonalizedProducts();
    }
    
    // Check for product ID parameter to track as recently viewed
    const productId = searchParams.get("productId");
    if (productId) {
      trackProductView(productId);
    }
    
    // Cleanup function to clear search operations when component unmounts
    return () => {
      searchOperations.clear();
    };
  }, []);
  
  // Track product view when opened
  const trackProductView = (productId: string) => {
    // Find the product in the current products list
    const product = products.find(p => (p.product_id || p.id) === productId);
    if (product) {
      addToRecentlyViewed({
        id: product.product_id || product.id || "",
        name: product.title || product.name || "",
        image: product.image || "",
        price: product.price
      });
    }
  };

  // Watch for search parameter changes - using useEffect with searchParams dependency
  // This is optimized to prevent duplicate searches
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam && searchParam !== searchTerm) {
      setSearchTerm(searchParam);
      
      // Generate unique ID for this search to prevent duplicate toasts
      const searchId = `search-${searchParam}-${Date.now()}`;
      searchIdRef.current = searchId;
      
      handleSearch(searchParam, searchParams.get("personId"), searchParams.get("occasionType"));
    }
  }, [searchParams]);

  // Load personalized products based on user profile
  const loadPersonalizedProducts = () => {
    // Only show loading if we don't already have products
    if (products.length === 0) {
      setIsLoading(true);
    }
    
    // Extract user interests from profile
    const userInterests = profile?.gift_preferences || [];
    const interests = Array.isArray(userInterests) 
      ? userInterests.map(pref => typeof pref === 'string' ? pref : pref.category)
      : [];

    console.log("User interests for personalization:", interests);

    let personalizedProducts: Product[] = [];
    
    // If we have interests, use them for personalized results
    if (interests.length > 0) {
      // Use up to 3 interests to create a personalized mix of products
      const personalizedQuery = interests.slice(0, 3).join(" ");
      personalizedProducts = searchMockProducts(personalizedQuery, 10);
      
      // Tag these products as preference-based
      personalizedProducts.forEach(product => {
        product.tags = product.tags || [];
        product.tags.push("Based on your preferences");
        product.fromPreferences = true;
      });
      
      // Mix in some general products
      const generalProducts = searchMockProducts("gift ideas", 6);
      
      // Combine and shuffle to create a diverse but personalized selection
      personalizedProducts = [...personalizedProducts.slice(0, 10), ...generalProducts.slice(0, 6)]
        .sort(() => Math.random() - 0.5); // Simple shuffle
      
      console.log(`Generated ${personalizedProducts.length} personalized products based on interests`);
    } else {
      // Fallback to default products if no interests
      personalizedProducts = searchMockProducts("gift ideas", 16);
      console.log("No interests found, using default products");
    }
    
    setProducts(personalizedProducts);
    setIsLoading(false);
  };
  
  // Enhanced search function with friend preferences - optimized to prevent duplicate toasts
  const handleSearch = (term: string, personId?: string | null, occasionType?: string | null) => {
    // Check if this exact search is already in progress and avoid duplicates
    const searchKey = `${term}-${personId || ''}-${occasionType || ''}`;
    if (searchOperations.has(searchKey) && Date.now() - searchOperations.get(searchKey) < 2000) {
      console.log(`Skipping duplicate search for "${term}"`);
      return;
    }
    
    // Record this search operation with timestamp
    searchOperations.set(searchKey, Date.now());
    
    // Clear previous toasts to avoid stacking
    toast.dismiss();
    
    setIsLoading(true);
    console.log(`MarketplaceWrapper: Searching for "${term}" with personId: ${personId}, occasionType: ${occasionType}`);
    
    try {
      let mockResults: Product[] = [];
      
      // Check if we have a personId (meaning this is a friend's event)
      if (personId) {
        // Simulate getting friend's wishlist and preferences
        // In a real implementation, you would fetch actual wishlist items and preferences
        const friendWishlistItems = searchMockProducts(`wishlist ${term}`, 4);
        const friendPreferenceItems = searchMockProducts(`preferences ${term}`, 6);
        
        // Tag the wishlist items
        friendWishlistItems.forEach(item => {
          // Extract the person's name from the search term
          const nameMatch = term.match(/^([^\s]+)/);
          const friendName = nameMatch ? nameMatch[1] : "Friend's";
          
          item.tags = item.tags || [];
          item.tags.push(`From ${friendName} Wishlist`);
          item.fromWishlist = true;
        });
        
        // Tag the preference based items
        friendPreferenceItems.forEach(item => {
          item.tags = item.tags || [];
          item.tags.push("Based on preferences");
          item.fromPreferences = true;
        });
        
        // Combine wishlist and preference items
        mockResults = [...friendWishlistItems, ...friendPreferenceItems];
        
        // Add some generic recommendations for this occasion type
        if (occasionType) {
          const genericItems = searchMockProducts(`${occasionType} gift ideas`, 6);
          mockResults = [...mockResults, ...genericItems];
        }
      } else {
        // Regular search without personalization
        mockResults = searchMockProducts(term, 16);
      }
      
      // Update products state
      setProducts(mockResults);
      
      console.log(`MarketplaceWrapper: Found ${mockResults.length} results for "${term}"`);
      
      // Show success toast only for significant searches and only once
      if (term.length > 3) {
        // Use a short timeout to ensure the UI has settled
        setTimeout(() => {
          // Check if this is still the current search
          if (searchIdRef.current === `search-${term}-${Date.now()}`) {
            toast.success(`Found ${mockResults.length} products for "${term}"`, {
              id: `search-success-${term}`, // Use consistent ID to prevent duplicates
            });
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error searching for products:', error);
      toast.error('Error searching for products', {
        id: `search-error-${term}`, // Use consistent ID to prevent duplicates
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search submission
  const onSearch = (term: string) => {
    if (!term.trim()) return;
    
    // Update URL parameter
    const params = new URLSearchParams(searchParams);
    params.set("search", term);
    // Clear personId and occasionType since this is a direct search
    params.delete("personId");
    params.delete("occasionType");
    setSearchParams(params);
    
    // Generate unique ID for this search
    const searchId = `search-${term}-${Date.now()}`;
    searchIdRef.current = searchId;
    
    // Directly handle search
    handleSearch(term);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <MarketplaceHeader 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onSearch={onSearch} 
      />
      
      {/* Compact categories section always visible */}
      <GiftingCategories />
      
      <MarketplaceContent 
        products={products}
        isLoading={isLoading}
        searchTerm={searchTerm}
      />
      
      {/* Recently viewed products section */}
      <RecentlyViewedProducts />
    </div>
  );
};

export default MarketplaceWrapper;
