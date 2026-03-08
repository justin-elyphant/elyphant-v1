
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const TestimonialsSection = () => {
  const navigate = useNavigate();

  return (
    <div className="mb-24 bg-foreground text-background p-12 md:p-16 text-center">
      <h2 className="font-sans text-2xl md:text-3xl font-bold mb-4">
        Ready to grow with Elyphant?
      </h2>
      <p className="text-background/70 text-lg mb-8 max-w-2xl mx-auto">
        Join a marketplace built around what recipients actually want — 
        powered by AI, driven by wishlists, and designed to eliminate returns.
      </p>
      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
        <div className="text-sm text-background/60">
          ✓ First 10 listings free &nbsp;&nbsp; ✓ 72-hour approval &nbsp;&nbsp; ✓ No monthly fees
        </div>
      </div>
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
