
import React from "react";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductProvider } from "@/contexts/ProductContext";
import HeroSection from "@/components/home/sections/HeroSection";

const HomeContent = () => {
  console.log("HomeContent component starting to render");
  
  try {
    const { user } = useAuth();
    const isMobile = useIsMobile();
    
    console.log("HomeContent auth and mobile checks completed", { user: !!user, isMobile });

    return (
      <ProductProvider>
        <div className="smooth-scroll will-change-scroll">
          <HeroSection />
          
          <div className="container mx-auto py-8 px-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to Gift Giver!</h2>
              <p className="text-gray-600">
                Your gift-giving experience is loading...
              </p>
            </div>
          </div>
        </div>
      </ProductProvider>
    );
  } catch (error) {
    console.error("Error in HomeContent:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Content Error</h1>
          <p className="text-gray-600">Unable to load the home content.</p>
        </div>
      </div>
    );
  }
};

export default HomeContent;
