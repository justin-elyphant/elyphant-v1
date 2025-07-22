
import React from "react";
import ModernCTA from "@/components/marketplace/hero/ModernCTA";
import HeroImage from "@/components/marketplace/hero/HeroImage";
import { useIsMobile } from "@/hooks/use-mobile";
import QuickPicksCarousel from "@/components/marketplace/quick-picks/QuickPicksCarousel";
import QuickGiftCTA from "@/components/dashboard/QuickGiftCTA";

const HomeContent = () => {
  const isMobile = useIsMobile();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12">
        <ModernCTA />
        <HeroImage 
          isMobile={isMobile}
          imageSrc="https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80"
          altText="Gift giving made easy"
        />
      </div>

      {/* Quick Gift CTA */}
      <div className="mb-8">
        <QuickGiftCTA />
      </div>
      
      {/* Quick Picks Carousel */}
      <div className="mb-8">
        <QuickPicksCarousel />
      </div>
    </div>
  );
};

export default HomeContent;
