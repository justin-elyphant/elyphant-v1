
import React from "react";
import { Button } from "@/components/ui/button";

interface VendorHeroProps {
  onContactClick: () => void;
}

export const VendorHero = ({ onContactClick }: VendorHeroProps) => {
  return (
    <div className="text-center max-w-4xl mx-auto mb-16">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        Grow Your Business with Elyphant
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Join our marketplace and connect with customers looking for meaningful gifts
      </p>
      <Button 
        size="lg"
        className="text-lg px-8 py-6" 
        onClick={onContactClick}
      >
        Become a Partner Today
      </Button>
    </div>
  );
};
