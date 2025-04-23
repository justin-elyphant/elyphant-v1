
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/contexts/ProductContext";
import HeroSection from "./sections/HeroSection";
import FeaturedProductsSection from "./sections/FeaturedProducts";
import ExperienceGiftingSection from "./sections/ExperienceGifting";
import HowItWorksSection from "./sections/HowItWorks";
import CategoriesGrid from "./sections/CategoriesGrid";
import TrustBar from "./sections/TrustBar";
import Footer from "./Footer";

const HomeContent = () => {
  const { isDebugMode } = useAuth();
  const { products, isLoading } = useProducts();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Trust Bar */}
      <TrustBar />
      
      {/* Featured Products Section */}
      <FeaturedProductsSection />
      
      {/* How It Works Section */}
      <HowItWorksSection />
      
      {/* Experience Gifting Section */}
      <ExperienceGiftingSection />
      
      {/* Categories Grid */}
      <CategoriesGrid />
      
      {isDebugMode && (
        <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-40">
          <Button
            onClick={() => navigate('/profile-setup')}
            variant="outline"
            className="border-2 border-purple-500 bg-white/90"
            size="sm"
          >
            Debug: Go to Profile Setup
          </Button>
          
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="border-2 border-blue-500 bg-white/90"
            size="sm"
          >
            Debug: Go to Dashboard
          </Button>
        </div>
      )}
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomeContent;
