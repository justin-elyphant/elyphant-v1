
import React, { useEffect, useState } from "react";
import { useMarketplaceProducts } from "./hooks/useMarketplaceProducts";
import { useProductTracking } from "./hooks/useProductTracking";
import { useSearchParams } from "react-router-dom";
import { useProductDataSync } from "@/hooks/useProductDataSync";

import MarketplaceHeader from "./MarketplaceHeader";
import GiftingCategories from "./GiftingCategories";
import MarketplaceContent from "./MarketplaceContent";
import RecentlyViewedProducts from "./RecentlyViewedProducts";
import OccasionMessage from "./header/OccasionMessage";
import OccasionCards from "./header/OccasionCards";
import { getUpcomingOccasions, getNextHoliday, GiftOccasion } from "./utils/upcomingOccasions";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import { useNavigate } from "react-router-dom";

const MarketplaceWrapper = () => {
  const { 
    searchTerm, 
    setSearchTerm, 
    isLoading, 
    products,
    onSearch 
  } = useMarketplaceProducts();
  
  // Initialize product tracking
  const { trackProductViewById } = useProductTracking(products);
  const { forceSyncNow } = useProductDataSync();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Occasion state for the hero banner
  const [currentOccasionIndex, setCurrentOccasionIndex] = useState(0);
  const [animationState, setAnimationState] = useState<"in" | "out">("in");
  const { friendOccasions, loading: loadingFriendOccasions } = useConnectedFriendsSpecialDates();
  
  // Get holiday occasions
  const holidayOccasions = getUpcomingOccasions();
  const nextHoliday = holidayOccasions.length > 0 ? holidayOccasions[0] : null;
  const secondHoliday = holidayOccasions.length > 1 ? holidayOccasions[1] : null;
  
  // Combine all occasions for the rotation
  const allOccasions = [...holidayOccasions, ...friendOccasions].sort((a, b) => 
    a.date.getTime() - b.date.getTime()
  );
  
  // Handle the occasion message rotation
  useEffect(() => {
    if (allOccasions.length === 0) return;
    
    const rotationInterval = setInterval(() => {
      setAnimationState("out");
      
      setTimeout(() => {
        setCurrentOccasionIndex((prev) => 
          prev + 1 >= allOccasions.length ? 0 : prev + 1
        );
        setAnimationState("in");
      }, 500); // Wait for fade out animation
    }, 5000); // Rotate every 5 seconds
    
    return () => clearInterval(rotationInterval);
  }, [allOccasions]);
  
  // Track product view when component mounts or URL parameters change
  useEffect(() => {
    const productId = searchParams.get("productId");
    if (productId) {
      console.log("MarketplaceWrapper: Tracking product view for ID:", productId);
      trackProductViewById(productId);
    }
  }, [searchParams, trackProductViewById]);
  
  // Force sync when component unmounts
  useEffect(() => {
    return () => {
      // Ensure any pending product views are synced
      forceSyncNow();
    };
  }, [forceSyncNow]);

  const handleSearchSubmit = () => {
    // Pass the current searchTerm to the onSearch function
    onSearch(searchTerm);
  };
  
  // Handle occasion card clicks
  const handleOccasionCardClick = (searchQuery: string, personId?: string, occasionType?: string) => {
    setSearchTerm(searchQuery);
    onSearch(searchQuery);
    
    if (personId) {
      console.log(`Searching for gifts for person ID: ${personId}, occasion: ${occasionType}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero banner with upcoming occasions */}
      <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
        <div className="flex flex-col gap-3">
          {/* Rotating occasion message */}
          <div className="h-8">
            {allOccasions.length > 0 && (
              <OccasionMessage 
                occasion={allOccasions[currentOccasionIndex]} 
                animationState={animationState} 
              />
            )}
          </div>
          
          {/* Occasion cards grid */}
          <OccasionCards 
            friendOccasions={friendOccasions}
            nextHoliday={nextHoliday}
            secondHoliday={secondHoliday}
            onCardClick={handleOccasionCardClick}
          />
        </div>
      </div>
      
      <MarketplaceHeader 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onSearch={handleSearchSubmit} 
      />
      
      {/* Compact categories section always visible */}
      <GiftingCategories />
      
      <MarketplaceContent 
        products={products}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onProductView={trackProductViewById}
      />
      
      {/* Recently viewed products section */}
      <RecentlyViewedProducts />
    </div>
  );
};

export default MarketplaceWrapper;
