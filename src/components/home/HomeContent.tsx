
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Hero from "./Hero";
import FeaturedProducts from "./sections/FeaturedProducts";
import FeaturedCollections from "./sections/FeaturedCollections";
import FeaturedBrands from "./sections/FeaturedBrands";
import AutomationFeatures from "./sections/AutomationFeatures";
import HomeCTA from "./sections/HomeCTA";
import UpcomingEvents from "../gifting/UpcomingEvents";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/contexts/ProductContext";

const HomeContent = () => {
  const { isDebugMode } = useAuth();
  const { products, isLoading } = useProducts();
  const navigate = useNavigate();

  // Create mock data for collections and brands
  const mockCollections = [
    { id: 1, name: "Summer Essentials", image: "https://placehold.co/300x300/e2e8f0/64748b?text=Summer" },
    { id: 2, name: "Office Gear", image: "https://placehold.co/300x300/e2e8f0/64748b?text=Office" },
    { id: 3, name: "Tech Gifts", image: "https://placehold.co/300x300/e2e8f0/64748b?text=Tech" },
    { id: 4, name: "Home Decor", image: "https://placehold.co/300x300/e2e8f0/64748b?text=Home" }
  ];

  const mockBrands = [
    { id: 1, name: "Apple", logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Apple", featured: true },
    { id: 2, name: "Samsung", logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Samsung", featured: true },
    { id: 3, name: "Nike", logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Nike", featured: true },
    { id: 4, name: "Sony", logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Sony", featured: true },
    { id: 5, name: "Microsoft", logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Microsoft", featured: false }
  ];
  
  // Select featured products for the component - handle potential undefined values
  const featuredProducts = products ? products.slice(0, 8) : [];
  
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <FeaturedProducts products={featuredProducts} />
        <FeaturedCollections collections={mockCollections} />
        <FeaturedBrands brands={mockBrands} />
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Featured Occasions</h2>
            <Link to="/events" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
              View all events
            </Link>
          </div>
          <UpcomingEvents />
        </div>
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
