import React from "react";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductProvider } from "@/contexts/ProductContext";
import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/home/sections/HeroSection";
import FeaturesSection from "@/components/home/sections/FeaturesSection";
import HomeCTA from "@/components/home/sections/HomeCTA";
import FeaturedCollections from "@/components/home/sections/FeaturedCollections";
import FeaturedOccasions from "@/components/home/sections/FeaturedOccasions";
import FeaturedProductsSection from "@/components/home/sections/FeaturedProducts";
import PopularBrandsSection from "@/components/home/sections/PopularBrandsSection";
import SeasonalGiftGuide from "@/components/home/sections/SeasonalGiftGuide";

const Home = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Sample collections data
  const collections = [
    {
      id: 1,
      name: "Gifts for Her",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80",
      callToAction: "Shop Now",
      searchTerm: "gifts for women"
    },
    {
      id: 2,
      name: "Gifts for Him",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
      callToAction: "Shop Now",
      searchTerm: "gifts for men"
    },
    {
      id: 3,
      name: "Gifts Under $50",
      image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=600&q=80",
      callToAction: "Shop Now",
      searchTerm: "gifts under 50 dollars"
    },
    {
      id: 4,
      name: "Luxury Gifts",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
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
      <MainLayout>
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
      </MainLayout>
    </ProductProvider>
  );
};

export default Home;
