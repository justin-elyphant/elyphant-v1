
import React, { useEffect } from "react";
import Hero from "./Hero";
import FeaturedProducts from "./sections/FeaturedProducts";
import FeaturedCategories from "./sections/FeaturedCategories";
import AutomationFeatures from "./sections/AutomationFeatures";
import PopularBrands from "@/components/gifting/PopularBrands";
import CategoriesGrid from "./sections/CategoriesGrid";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

const HomeContent = () => {
  useEffect(() => {
    // Clear any lingering onboarding state that might show the "Welcome to Gift Giver" screen
    LocalStorageService.clearProfileCompletionState();
    LocalStorageService.cleanupDeprecatedKeys();
    
    // Set fresh context for homepage visit
    LocalStorageService.setNicoleContext({
      source: 'homepage_visit',
      currentPage: '/',
      timestamp: new Date().toISOString()
    });
  }, []);

  return (
    <div className="min-h-screen">
      <Hero />
      
      {/* Container with consistent padding for all sections */}
      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Gifts for Her Section - Featured Products */}
        <FeaturedProducts 
          searchTerm="gifts for her" 
          title="Gifts for Her" 
          maxProducts={20}
        />
        
        {/* Popular Brands Section */}
        <PopularBrands />
        
        {/* Featured Categories */}
        <FeaturedCategories />
        
        {/* Categories Grid */}
        <CategoriesGrid />
        
        {/* Automation Features */}
        <AutomationFeatures />
      </div>
    </div>
  );
};

export default HomeContent;
