
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Hero from "./Hero";
import FeaturedProducts from "./sections/FeaturedProducts";
import FeaturedCollections from "./sections/FeaturedCollections";
import FeaturedBrands from "./sections/FeaturedBrands";
import AutomationFeatures from "./sections/AutomationFeatures";
import HomeCTA from "./sections/HomeCTA";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";

const HomeContent = () => {
  const { isDebugMode } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <FeaturedProducts />
      <FeaturedCollections />
      <FeaturedBrands />
      <AutomationFeatures />
      <HomeCTA />
      
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
    </div>
  );
};

export default HomeContent;
