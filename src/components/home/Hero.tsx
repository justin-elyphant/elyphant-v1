
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gift, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { FullWidthSection } from "@/components/layout/FullWidthSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import GiftCountdown from "./sections/GiftCountdown";
import { getNextHoliday } from "@/components/marketplace/utils/upcomingOccasions";
import { format } from "date-fns";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const nextHoliday = getNextHoliday();

  // Enhanced handler for CTAs: sets intent and routes based on auth
  const handleCta = (intent: "giftor" | "giftee") => {
    localStorage.setItem("ctaIntent", intent);
    if (user) {
      // Authenticated user: go to guided experience instead of marketplace
      if (intent === "giftor") {
        // Navigate to marketplace with search mode to encourage intentional shopping
        // Pass fromHome state to ensure clean filters
        navigate("/marketplace?search=gift ideas", { state: { fromHome: true } });
      } else {
        navigate("/wishlists");
      }
    } else {
      // Not logged in: send to signup (onboarding flow will route post-auth)
      navigate("/signup");
    }
  };

  return (
    <FullWidthSection className="relative min-h-[80vh] md:min-h-[85vh] overflow-hidden safe-area-top">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat gpu-accelerated"
        style={{
          backgroundImage: `url('/lovable-uploads/71b54185-9bbb-41d9-a722-df038ac4de04.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%', // Adjusted to show more of the family's faces
        }}
      >
        {/* Lighter Gradient Overlay for better visibility of faces */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-black/15"></div>
      </div>

      {/* Holiday Countdown Overlay */}
      {nextHoliday && (
        <div className="absolute top-4 right-4 z-20 hidden md:block intersection-target">
          <GiftCountdown event={nextHoliday} />
        </div>
      )}

      {/* Mobile Countdown Banner - Optimized positioning */}
      {nextHoliday && (
        <div className="absolute top-4 left-0 right-0 z-20 md:hidden safe-area-inset">
          <div className="mx-4">
            <ResponsiveContainer padding="minimal">
              <div className="text-center">
                <GiftCountdown event={nextHoliday} />
                <p className="text-white text-sm mt-2 font-medium bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block">
                  {format(nextHoliday.date, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hero Content - Optimized mobile padding */}
      <div className="relative z-10 flex items-center min-h-[80vh] md:min-h-[85vh]">
        <ResponsiveContainer className={`${nextHoliday ? 'pt-24 md:pt-8' : 'pt-8'} safe-area-inset`}>
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
                className="bg-purple-600 hover:bg-purple-700 text-white border-0 text-lg px-8 py-4 shadow-lg touch-target-48 touch-manipulation tap-feedback no-select"
                onClick={(e) => {
                  e.preventDefault();
                  handleCta("giftor");
                }}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Find Perfect Gifts
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/90 text-white hover:bg-white/15 hover:text-white text-lg px-8 py-4 bg-black/20 backdrop-blur-sm shadow-lg touch-target-48 touch-manipulation tap-feedback no-select"
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
