
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import { useProfile } from "@/contexts/profile/ProfileContext";

const HomeContent = () => {
  const { trackRender } = usePerformanceMonitor();
  const { profile } = useProfile();
  const location = useLocation();
  
  useEffect(() => {
    if (location.pathname === '/auth') return;

    let isMounted = true;
    const startTime = performance.now();
    
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;
      
      try {
        LocalStorageService.clearProfileCompletionState();
        LocalStorageService.cleanupDeprecatedKeys();
        
        LocalStorageService.setNicoleContext({
          source: 'homepage_visit',
          currentPage: '/',
          timestamp: new Date().toISOString()
        });
        
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
      
      if (!isInIframe() && isMounted) {
        const setupTime = performance.now() - startTime;
        trackRender("HomeContent", startTime);
      }
    }, 150);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [location.pathname, profile?.id]);

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
