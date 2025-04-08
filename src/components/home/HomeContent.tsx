
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Hero from "./Hero";
import FeaturedCollections from "./sections/FeaturedCollections";
import FeaturedBrands from "./sections/FeaturedBrands";
import FeaturedOccasions from "./sections/FeaturedOccasions"; 
import AutomationFeatures from "./sections/AutomationFeatures";
import HomeCTA from "./sections/HomeCTA";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/contexts/ProductContext";

const HomeContent = () => {
  const { isDebugMode } = useAuth();
  const { products, isLoading } = useProducts();
  const navigate = useNavigate();

  // Create mock data for collections and brands with high-quality stock photos
  const mockCollections = [
    { 
      id: 1, 
      name: "Summer Essentials", 
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      callToAction: "Explore Summer Gifts"
    },
    { 
      id: 2, 
      name: "Office Gear", 
      image: "https://images.unsplash.com/photo-1497215842964-222b430dc094?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      callToAction: "Shop Office Tech Gifts"
    },
    { 
      id: 3, 
      name: "Tech Gifts", 
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      callToAction: "Discover Tech Gifts"
    },
    { 
      id: 4, 
      name: "Pet Gifts", 
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      callToAction: "Find Gifts for Pets",
      url: "/gifting?tab=products&category=pets"
    },
    { 
      id: 5, 
      name: "Home Decor", 
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      callToAction: "Find Home Decor Gifts"
    }
  ];

  const mockBrands = [
    { 
      id: 1, 
      name: "Apple", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg", 
      featured: true 
    },
    { 
      id: 2, 
      name: "Samsung", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/2560px-Samsung_Logo.svg.png", 
      featured: true 
    },
    { 
      id: 3, 
      name: "Nike", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png", 
      featured: true 
    },
    { 
      id: 4, 
      name: "Sony", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/2560px-Sony_logo.svg.png", 
      featured: true 
    },
    { 
      id: 5, 
      name: "Microsoft", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png", 
      featured: false 
    }
  ];
  
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <FeaturedCollections collections={mockCollections} />
        <FeaturedBrands brands={mockBrands} />
        <FeaturedOccasions />
        <AutomationFeatures />
        <HomeCTA />
      </div>
      
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
