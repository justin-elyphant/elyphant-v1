import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gift } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { FullWidthSection } from "@/components/layout/FullWidthSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import GiftCountdown from "../countdown/GiftCountdown";
import { getNextHoliday } from "@/components/marketplace/utils/upcomingOccasions";
import { format } from "date-fns";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import OnboardingIntentModal from "@/components/auth/signup/OnboardingIntentModal";
import { GiftSetupWizard } from "@/components/gifting/GiftSetupWizard";
import CreateWishlistDialog from "@/components/gifting/wishlist/CreateWishlistDialog";
import { toast } from "sonner";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const nextHoliday = getNextHoliday();
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [showGiftWizard, setShowGiftWizard] = useState(false);
  const [showCreateWishlist, setShowCreateWishlist] = useState(false);

  // Enhanced handler for CTAs: sets intent and routes based on auth
  const handleCta = (intent: "giftor" | "giftee") => {
    LocalStorageService.setNicoleContext({ selectedIntent: intent, source: 'hero_cta' });
    if (user) {
      // Authenticated user: show intent modal to choose their path
      if (intent === "giftor") {
        setShowIntentModal(true);
      } else {
        navigate("/wishlists");
      }
    } else {
      // Not logged in: send to signup (streamlined onboarding flow will route post-auth)
      navigate("/auth");
    }
  };

  // Handle intent selection from modal
  const handleIntentSelect = (userIntent: "quick-gift" | "browse-shop" | "create-wishlist") => {
    setShowIntentModal(false);
    
    switch (userIntent) {
      case "quick-gift":
        setShowGiftWizard(true);
        break;
      case "browse-shop":
        navigate("/marketplace?mode=nicole&open=true&greeting=giftor-intent&first_name=true");
        break;
      case "create-wishlist":
        setShowCreateWishlist(true);
        break;
    }
  };

  // Handle wishlist creation
  const handleCreateWishlistSubmit = async (values: any) => {
    // This would typically create the wishlist
    toast.success("Wishlist created successfully!");
    setShowCreateWishlist(false);
    navigate("/wishlists");
  };

  return (
    <FullWidthSection className="relative min-h-[80vh] md:min-h-[85vh] overflow-hidden safe-area-top intersection-target">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat gpu-accelerated will-change-transform"
        style={{
          backgroundImage: `url('/lovable-uploads/71b54185-9bbb-41d9-a722-df038ac4de04.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-black/15"></div>
      </div>

      {/* Holiday Countdown Overlay */}
      {nextHoliday && (
        <div className="absolute top-4 right-4 z-20 hidden md:block intersection-target safe-area-inset">
          <GiftCountdown event={nextHoliday} />
        </div>
      )}

      {/* Mobile Countdown Banner - Optimized positioning */}
      {nextHoliday && (
        <div className="absolute top-4 left-0 right-0 z-20 md:hidden safe-area-inset safe-area-inset-top">
          <div className="mx-4">
            <ResponsiveContainer padding="minimal">
              <div className="text-center">
                <GiftCountdown event={nextHoliday} />
                <p className="text-white text-sm mt-2 font-medium bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block ios-modal-backdrop">
                  {format(nextHoliday.date, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hero Content - Optimized mobile padding */}
      <div className="relative z-10 flex items-center min-h-[80vh] md:min-h-[85vh]">
        <ResponsiveContainer className={`${nextHoliday ? 'pt-24 md:pt-8' : 'pt-8'} safe-area-inset safe-area-inset-top`}>
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-shadow-lg no-select">
              Connecting Through Gifting
            </h1>
            <p className="text-lg md:text-xl text-gray-100 mb-8 leading-relaxed max-w-xl text-shadow-md no-select">
              Create wishlists, automate gift-giving, and never miss 
              an important celebration again. Our platform handles everything from selection to delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white border-0 text-lg px-8 py-4 shadow-lg touch-target-48 touch-manipulation tap-feedback no-select gpu-accelerated"
                onClick={(e) => {
                  e.preventDefault();
                  handleCta("giftor");
                }}
                aria-label="Start Gifting"
              >
                <Gift className="mr-2 h-5 w-5" />
                Start Gifting
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/90 text-white hover:bg-white/15 hover:text-white text-lg px-8 py-4 bg-black/20 backdrop-blur-sm shadow-lg touch-target-48 touch-manipulation tap-feedback no-select gpu-accelerated ios-modal-backdrop"
                onClick={(e) => {
                  e.preventDefault();
                  handleCta("giftee");
                }}
                aria-label="Create Wishlist"
              >
                <Gift className="mr-2 h-5 w-5" />
                Create Wishlist
              </Button>
            </div>
          </div>
        </ResponsiveContainer>
      </div>

      {/* Intent Modal for authenticated users */}
      <OnboardingIntentModal
        open={showIntentModal}
        onSelect={handleIntentSelect}
        onSkip={() => setShowIntentModal(false)}
      />

      {/* Gift Setup Wizard */}
      <GiftSetupWizard 
        open={showGiftWizard}
        onOpenChange={setShowGiftWizard}
      />

      {/* Create Wishlist Dialog */}
      <CreateWishlistDialog
        open={showCreateWishlist}
        onOpenChange={setShowCreateWishlist}
        onSubmit={handleCreateWishlistSubmit}
      />
    </FullWidthSection>
  );
};

export default Hero;
