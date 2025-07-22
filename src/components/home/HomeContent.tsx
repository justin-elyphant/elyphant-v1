
import React, { useEffect } from "react";
import Hero from "./sections/hero/Hero";
import GiftCategoriesCarousel from "./sections/GiftCategoriesCarousel";
import FeaturedCategories from "./sections/FeaturedCategories";
import AutomationFeatures from "./sections/AutomationFeatures";
import PopularBrands from "@/components/gifting/PopularBrands";
import CategoriesGrid from "./sections/CategoriesGrid";
import SocialProofSection from "./sections/SocialProofSection";
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
      {/* Hero section - maintains its own layout */}
      <Hero />
      
      {/* Bleed-first sections with no external container constraints */}
      <GiftCategoriesCarousel />
      
      {/* Traditional sections with container - will be refactored later */}
      <div className="container mx-auto px-4 py-8 space-y-16">
        <PopularBrands />
        <FeaturedCategories />
        <CategoriesGrid />
        <AutomationFeatures />
      </div>
      
      {/* Full bleed social proof */}
      <SocialProofSection />
    </div>
  );
};

export default HomeContent;
