
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface VendorHeroProps {
  onContactClick: () => void;
}

export const VendorHero = ({ onContactClick }: VendorHeroProps) => {
  const navigate = useNavigate();

  return (
    <div className="text-center max-w-4xl mx-auto mb-24 pt-8">
      <h1 className="font-sans text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-6 leading-tight">
        Your products.<br />Their perfect gift.
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
        Elyphant connects your catalog with gift-givers using AI-powered matching 
        and wishlist-driven purchasing — so every sale sticks.
      </p>
      <p className="text-base text-muted-foreground mb-10 max-w-2xl mx-auto">
        Near-zero returns. Automated gifting. Scheduled deliveries. 
        Your first 10 listings are free.
      </p>
      <Button 
        size="lg"
        className="bg-[hsl(0,84%,50%)] hover:bg-[hsl(0,84%,42%)] text-white text-lg px-10 py-6 rounded-none font-semibold tracking-wide" 
        onClick={() => navigate('/vendor-portal')}
      >
        Apply Now
      </Button>
    </div>
  );
};
