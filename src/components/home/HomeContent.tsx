
import React, { useEffect } from "react";
import Hero from "./sections/hero/Hero";
import GiftCategoriesGrid from "./sections/GiftCategoriesGrid";
import FeaturedCategories from "./sections/FeaturedCategories";
import AutomationFeatures from "./sections/AutomationFeatures";
import PopularBrands from "@/components/gifting/PopularBrands";
import PersonTypeCarousel from "./sections/CategoriesGrid";
import WishlistCreationCTA from "./sections/WishlistCreationCTA";
import ConnectionsCTA from "./sections/ConnectionsCTA";
import SocialProofSection from "./sections/SocialProofSection";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { usePerformanceMonitor } from "@/utils/performanceMonitoring";
import { isInIframe } from "@/utils/iframeUtils";
import { preloadRoutes, preloadCriticalImages } from "@/utils/lazyLoading";

const HomeContent = () => {
  const { trackRender } = usePerformanceMonitor();
  
  useEffect(() => {
    let isMounted = true;
    const startTime = performance.now();
    
    // Debounce to prevent multiple rapid executions during page refresh
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;
      
      try {
        // Check if user just completed signup for welcome messaging
        const justCompletedSignup = localStorage.getItem('justCompletedSignup');
        if (justCompletedSignup) {
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
        
        // Preload likely next pages and critical assets during idle time
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            if (isMounted) {
              preloadRoutes();
              preloadCriticalImages([]);
            }
          });
        } else {
          preloadRoutes();
          preloadCriticalImages([]);
        }
      } catch (error) {
        console.warn('LocalStorage operations failed (possibly in iframe):', error);
      }
      
      // Only track performance outside of iframe to avoid interference
      if (!isInIframe() && isMounted) {
        const setupTime = performance.now() - startTime;
        trackRender("HomeContent", startTime);
      }
    }, 50); // Small delay to prevent rapid re-execution
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []); // Remove trackRender dependency to prevent re-execution

  return (
    <div className="min-h-screen">
      {/* Hero section - maintains its own layout */}
      <Hero />
      
      {/* Category grid section */}
      <GiftCategoriesGrid />
      
      {/* Connections CTA - Build your network */}
      <ConnectionsCTA />
      
      {/* Product discovery and wishlist CTA section */}
      <WishlistCreationCTA />
      
      {/* Traditional sections with container - will be refactored later */}
      <div className="container-content space-y-unified">
        <PopularBrands />
        <FeaturedCategories />
      </div>
      
      {/* Additional bleed sections */}
      <PersonTypeCarousel />
      
      {/* More traditional sections with much larger top spacing */}
      <div className="container-content pt-16 md:pt-24 lg:pt-32">
        <AutomationFeatures />
      </div>
      
      {/* Full bleed social proof */}
      <SocialProofSection />
    </div>
  );
};

export default HomeContent;
