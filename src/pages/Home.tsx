import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductProvider } from "@/contexts/ProductContext";
import { ResponsiveNavigation } from "@/components/layout/ResponsiveNavigation";
import HeroSection from "@/components/home/sections/HeroSection";
import FeaturesSection from "@/components/home/sections/FeaturesSection";
import HomeCTA from "@/components/home/sections/HomeCTA";
import FeaturedCollections from "@/components/home/sections/FeaturedCollections";
import FeaturedOccasions from "@/components/home/sections/FeaturedOccasions";
import FeaturedProductsSection from "@/components/home/sections/FeaturedProducts";
import PopularBrandsSection from "@/components/home/sections/PopularBrandsSection";
import SeasonalGiftGuide from "@/components/home/sections/SeasonalGiftGuide";
// Note: Footer component is now part of MainLayout, or should be added separately if Home doesn't use MainLayout.
// Assuming Home page will eventually be wrapped by MainLayout or have the Footer component added explicitly.
// For now, we remove the inline footer here to avoid duplication if MainLayout is used.

const Home = () => {
  // ... keep existing code (user, isMobile, collections, brands definitions)
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Sample collections data
  const collections = [
    {
      id: 1,
      name: "Gifts for Her",
      image: null,
      callToAction: "Shop Now",
      searchTerm: "gifts for women"
    },
    {
      id: 2,
      name: "Gifts for Him",
      image: null,
      callToAction: "Shop Now",
      searchTerm: "gifts for men"
    },
    {
      id: 3,
      name: "Gifts Under $50",
      image: null,
      callToAction: "Shop Now",
      searchTerm: "gifts under 50 dollars"
    },
    {
      id: 4,
      name: "Luxury Gifts",
      image: null,
      callToAction: "Shop Luxury",
      searchTerm: "luxury gifts"
    }
  ];
  
  // Sample brands data
  const brands = [
    {
      id: 1,
      name: "Nike",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png",
      featured: true
    },
    {
      id: 2,
      name: "Lululemon",
      logo: "/lovable-uploads/f0a52aa3-9dcd-4367-9a66-0724e97f2641.png",
      featured: true
    },
    {
      id: 3,
      name: "Apple",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
      featured: true
    },
    {
      id: 4,
      name: "Made In",
      logo: "/lovable-uploads/c8d47b72-d4ff-4269-81b0-e53a01164c71.png",
      featured: true
    }
  ];

  return (
    <ProductProvider>
      <div className="min-h-screen flex flex-col">
        <ResponsiveNavigation />
        <main className="flex-grow">
          {/* Hero Section */}
          <HeroSection />
          
          {/* Featured Collections Section */}
          <FeaturedCollections collections={collections} />
          
          {/* Occasions-Based Gift Collections */}
          <FeaturedOccasions />
          
          {/* Trending Products Carousel */}
          <FeaturedProductsSection />
          
          {/* Popular Brands Section */}
          <PopularBrandsSection />
          
          {/* Seasonal Gift Guide */}
          <SeasonalGiftGuide />
          
          {/* Features Section */}
          <FeaturesSection />
          
          {/* Call to Action */}
          <HomeCTA />
        </main>
        
        {/* The custom inline footer that was here has been removed. 
            The global Footer component (via MainLayout or added directly) should now be used. 
            If Home.tsx is not wrapped by MainLayout, you'll need to explicitly add <Footer /> here.
            For demonstration, assuming it will use a layout that includes the footer or it will be added later.
        */}
      </div>
    </ProductProvider>
  );
};

export default Home;
