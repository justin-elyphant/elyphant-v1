
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface VendorHeroProps {
  onContactClick: () => void;
}

export const VendorHero = ({ onContactClick }: VendorHeroProps) => {
  const navigate = useNavigate();

  return (
    <div className="text-center max-w-4xl mx-auto mb-16">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        Grow Your Business with Elyphant
      </h1>
      <p className="text-xl text-gray-600 mb-4">
        Join our marketplace and connect with customers looking for meaningful gifts
      </p>
      <p className="text-lg text-gray-600 mb-8">
        Our seamless vendor portal makes it easy to showcase your products, manage inventory,
        and track your success all in one place.
      </p>
      <Button 
        size="lg"
        className="text-lg px-8 py-6" 
        onClick={() => navigate('/vendor-signup')}
      >
        Become a Partner Today
      </Button>
    </div>
  );
};
