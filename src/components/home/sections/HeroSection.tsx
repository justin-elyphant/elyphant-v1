
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gift, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";

const HeroSection = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <div className="relative bg-gradient-to-br from-purple-50 to-indigo-100 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-grid-pattern"></div>
      </div>
      
      <div className="container relative z-10 mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Gift-Giving <span className="text-purple-600">Simplified</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
              Create wishlists, find perfect gifts, and never miss an important occasion. Our AI-powered platform makes thoughtful gifting effortless.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Button asChild size={isMobile ? "default" : "lg"} className="bg-purple-600 hover:bg-purple-700">
                <Link to={user ? "/dashboard" : "/signup"}>
                  <Gift className="mr-2 h-5 w-5" />
                  {user ? "Go to Dashboard" : "Start Gifting"}
                </Link>
              </Button>
              <Button asChild variant="outline" size={isMobile ? "default" : "lg"}>
                <Link to="/wishlists">
                  Create Wishlist
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="md:w-1/2 relative">
            <div className="relative z-10">
              <img 
                src="/lovable-uploads/40945f7c-45d5-47dd-8e0c-00ce6f201816.png"
                alt="Gift giving made easy" 
                className="rounded-lg shadow-xl max-w-full h-auto"
              />
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg p-4 shadow-lg hidden md:block">
                <p className="font-bold text-purple-600">Thoughtful gifts, every time</p>
                <p className="text-sm text-gray-600">Powered by smart recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
