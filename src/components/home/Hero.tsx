
import React from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Gift, ShoppingBag } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();

  // Helper to flag user's CTA intent before redirecting (for onboarding modal)
  const handleCta = (intent: "giftor" | "giftee", url: string) => {
    // Store for onboarding flow to pick up
    localStorage.setItem("ctaIntent", intent);
    navigate(url);
  };

  return (
    <div className="bg-gradient-to-r from-purple-100 to-purple-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <h2 className="text-3xl font-bold mb-3">Connecting Through Gifting</h2>
            <p className="text-base text-gray-700 mb-4">
              Create wishlists, automate gift-giving, and never miss 
              an important celebration again. Our platform handles everything from selection to delivery.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="default"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={(e) => {
                  e.preventDefault();
                  handleCta("giftor", "/gifting");
                }}
              >
                <a href="/gifting">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Start Gifting
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="default"
                onClick={(e) => {
                  e.preventDefault();
                  handleCta("giftee", "/wishlists");
                }}
              >
                <a href="/wishlists">
                  <Gift className="mr-2 h-4 w-4" />
                  Create Wishlist
                </a>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-end">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a" 
                alt="Person opening a gift" 
                className="rounded-lg shadow-lg max-w-full h-auto max-h-[220px] object-cover"
              />
              <div className="absolute bottom-4 right-4 bg-white bg-opacity-80 rounded-lg px-3 py-2 text-sm font-medium text-purple-800 shadow-sm">
                Personalized Gift Experiences
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
