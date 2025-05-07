
import React, { useEffect, useState } from "react";
import { getUpcomingOccasions, GiftOccasion } from "./utils/upcomingOccasions";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import MarketplaceLoading from "./MarketplaceLoading";
import MarketplaceHeader from "./MarketplaceHeader";
import GiftingCategories from "./GiftingCategories";
import PopularBrands from "./PopularBrands";
import MarketplaceContent from "./MarketplaceContent";
import { useMarketplaceProducts } from "./hooks/useMarketplaceProducts";
import MarketplaceNavLinks from "./components/MarketplaceNavLinks";
import MarketplaceTopNav from "./components/MarketplaceTopNav";
import ProductDetailsManager from "./components/ProductDetailsManager";

const MarketplaceWrapper = () => {
  const [upcomingOccasions, setUpcomingOccasions] = useState<GiftOccasion[]>([]);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [userData] = useLocalStorage("userData", null);
  const { 
    searchTerm,
    localSearchTerm,
    setLocalSearchTerm,
    handleSearch,
    isLoading,
    initialLoadComplete,
    products
  } = useMarketplaceProducts();

  useEffect(() => {
    setUpcomingOccasions(getUpcomingOccasions());
  }, []);

  // Show loading state during initial load
  if (!initialLoadComplete) {
    return <MarketplaceLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Section */}
      <div className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <MarketplaceTopNav onSignUpRequired={() => setShowSignUpDialog(true)} />
          
          {/* Quick Navigation Links */}
          <MarketplaceNavLinks upcomingOccasions={upcomingOccasions} />
        </div>
      </div>

      <div className="container mx-auto px-4 pt-6 space-y-8">
        {/* New Hero Header without Search */}
        <MarketplaceHeader 
          searchTerm={localSearchTerm} 
          setSearchTerm={setLocalSearchTerm} 
          onSearch={handleSearch} 
        />
        
        {/* Gift Categories Section */}
        <GiftingCategories />
        
        {/* Popular Brands Section */}
        <PopularBrands />
        
        {/* Product Grid with Filters */}
        <MarketplaceContent 
          products={products}
          isLoading={isLoading}
          searchTerm={searchTerm}
        />
      </div>
      
      {/* Product Details and Sign Up Dialog Manager */}
      <ProductDetailsManager products={products} userData={userData} />
    </div>
  );
};

export default MarketplaceWrapper;
