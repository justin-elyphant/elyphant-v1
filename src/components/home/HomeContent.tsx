
import React, { useEffect } from "react";
import Hero from "./sections/hero/Hero";
import GiftCategoriesCarousel from "./sections/GiftCategoriesCarousel";
import FeaturedCategories from "./sections/FeaturedCategories";
import AutomationFeatures from "./sections/AutomationFeatures";
import PopularBrands from "@/components/gifting/PopularBrands";
import CategoriesGrid from "./sections/CategoriesGrid";
import SocialProofSection from "./sections/SocialProofSection";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { usePerformanceMonitor } from "@/utils/performanceMonitoring";
import { isInIframe } from "@/utils/iframeUtils";

const HomeContent = () => {
  const { trackRender } = usePerformanceMonitor();
  
  useEffect(() => {
    const startTime = performance.now();
    console.log("HomeContent: Starting component mount and data operations");
    
    try {
      // Clear any lingering onboarding state that might show the "Welcome to Gift Giver" screen
      LocalStorageService.clearProfileCompletionState();
      LocalStorageService.cleanupDeprecatedKeys();
      
      // Set fresh context for homepage visit
      LocalStorageService.setNicoleContext({
        source: 'homepage_visit',
        currentPage: '/',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('LocalStorage operations failed (possibly in iframe):', error);
    }
    
    // Only track performance outside of iframe to avoid interference
    if (!isInIframe()) {
      const setupTime = performance.now() - startTime;
      console.log(`HomeContent: Setup completed in ${setupTime.toFixed(2)}ms`);
      trackRender("HomeContent", startTime);
    }
  }, [trackRender]);

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
