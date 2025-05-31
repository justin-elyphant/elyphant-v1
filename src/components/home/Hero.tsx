
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gift, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { FullWidthSection } from "@/components/layout/FullWidthSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import GiftCountdown from "./sections/GiftCountdown";
import { getNextHoliday } from "@/components/marketplace/utils/upcomingOccasions";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const nextHoliday = getNextHoliday();

  // Enhanced handler for CTAs: sets intent and routes based on auth
  const handleCta = (intent: "giftor" | "giftee") => {
    localStorage.setItem("ctaIntent", intent);
    if (user) {
      // Authenticated user: go direct to feature page
      if (intent === "giftor") {
        navigate("/marketplace");
      } else {
        navigate("/wishlists");
      }
    } else {
      // Not logged in: send to signup (onboarding flow will route post-auth)
      navigate("/signup");
    }
  };

  return (
    <FullWidthSection className="relative min-h-[80vh] md:min-h-[85vh] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/db80a3a5-8527-4c7e-b582-12370cac28dc.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      >
        {/* Lighter Gradient Overlay for better visibility of faces */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/30"></div>
      </div>

      {/* Holiday Countdown Overlay */}
      {nextHoliday && (
        <div className="absolute top-4 right-4 z-20 hidden md:block">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4">
            <GiftCountdown event={nextHoliday} />
          </div>
        </div>
      )}

      {/* Mobile Countdown Banner */}
      {nextHoliday && (
        <div className="absolute top-0 left-0 right-0 z-20 md:hidden">
          <div className="bg-white/95 backdrop-blur-sm border-b">
            <ResponsiveContainer padding="minimal">
              <GiftCountdown event={nextHoliday} />
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hero Content */}
      <div className="relative z-10 flex items-center min-h-[80vh] md:min-h-[85vh]">
        <ResponsiveContainer className={`${nextHoliday ? 'pt-24 md:pt-8' : 'pt-8'}`}>
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-shadow-lg">
              Connecting Through Gifting
            </h1>
            <p className="text-lg md:text-xl text-gray-100 mb-8 leading-relaxed max-w-xl text-shadow-md">
              Create wishlists, automate gift-giving, and never miss 
              an important celebration again. Our platform handles everything from selection to delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white border-0 text-lg px-8 py-4 shadow-lg"
                onClick={(e) => {
                  e.preventDefault();
                  handleCta("giftor");
                }}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Start Gifting
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/90 text-white hover:bg-white/15 hover:text-white text-lg px-8 py-4 bg-black/20 backdrop-blur-sm shadow-lg"
                onClick={(e) => {
                  e.preventDefault();
                  handleCta("giftee");
                }}
              >
                <Gift className="mr-2 h-5 w-5" />
                Create Wishlist
              </Button>
            </div>
          </div>
        </ResponsiveContainer>
      </div>
    </FullWidthSection>
  );
};

export default Hero;
