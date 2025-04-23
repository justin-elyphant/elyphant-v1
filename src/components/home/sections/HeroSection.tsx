
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Gift, Clipboard } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="relative h-[500px] w-full overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/lovable-uploads/40945f7c-45d5-47dd-8e0c-00ce6f201816.png"
          alt="Beautifully wrapped gifts on a wooden shelf" 
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 to-slate-900/30" />
      </div>
      
      {/* Hero Content */}
      <div className="container relative z-10 flex h-full items-center px-4">
        <div className="max-w-lg text-white">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            The Smartest Way to Send a Gift
          </h1>
          <p className="mb-8 text-base md:text-lg lg:text-xl text-slate-200">
            AI-assisted gifting that connects you with the perfect product or experience — every time, for every occasion.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
              <Link to="/gifting">
                <Gift className="mr-2 h-5 w-5" />
                Start Gifting
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
              <Link to="/wishlists">
                <Clipboard className="mr-2 h-5 w-5" />
                Create Wishlist
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

