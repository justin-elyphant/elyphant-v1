
import React, { useEffect } from "react";
import Hero from "./sections/hero/Hero";
import GiftCategoriesCarousel from "./sections/GiftCategoriesCarousel";
import FeaturedCategories from "./sections/FeaturedCategories";
import AutomationFeatures from "./sections/AutomationFeatures";
import PopularBrands from "@/components/gifting/PopularBrands";
import PersonTypeCarousel from "./sections/CategoriesGrid";
import WishlistCreationCTA from "./sections/WishlistCreationCTA";
import SocialProofSection from "./sections/SocialProofSection";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { usePerformanceMonitor } from "@/utils/performanceMonitoring";
import { isInIframe } from "@/utils/iframeUtils";
import { preloadRoutes, preloadCriticalImages } from "@/utils/lazyLoading";

const HomeContent = () => {
  const { trackRender } = usePerformanceMonitor();
  
  useEffect(() => {
    const startTime = performance.now();
    console.log("HomeContent: Starting component mount and data operations");
    
    try {
      // Check if user just completed signup for welcome messaging
      const justCompletedSignup = localStorage.getItem('justCompletedSignup');
      if (justCompletedSignup) {
        console.log("🎉 New user detected - setting up welcome context");
        localStorage.removeItem('justCompletedSignup');
        
        // Set Nicole context to be helpful for new users
        LocalStorageService.setNicoleContext({
          source: 'new_user_homepage',
          currentPage: '/',
          timestamp: new Date().toISOString()
        });
      } else {
        // Clear any lingering onboarding state for returning users
        LocalStorageService.clearProfileCompletionState();
        LocalStorageService.cleanupDeprecatedKeys();
        
        // Set fresh context for homepage visit
        LocalStorageService.setNicoleContext({
          source: 'homepage_visit',
          currentPage: '/',
          timestamp: new Date().toISOString()
        });
      }
      
      // Preload likely next pages and critical assets
      preloadRoutes();
      
      // Preload critical images (add your most important image URLs here)
      preloadCriticalImages([
        // Add URLs of hero images or other critical assets
      ]);
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
      <WishlistCreationCTA />
      
      {/* Traditional sections with container - will be refactored later */}
      <div className="container mx-auto px-4 py-8 space-y-16">
        <PopularBrands />
        <FeaturedCategories />
      </div>
      
      {/* Additional bleed sections */}
      <PersonTypeCarousel />
      
      {/* More traditional sections */}
      <div className="container mx-auto px-4 py-8">
        <AutomationFeatures />
      </div>
      
      {/* Full bleed social proof */}
      <SocialProofSection />
    </div>
  );
};

export default HomeContent;
