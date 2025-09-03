
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gift } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { FullWidthSection } from "@/components/layout/FullWidthSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import GiftCountdown from "../countdown/GiftCountdown";
import { getNextHoliday } from "@/components/marketplace/utils/upcomingOccasions";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import useTargetEvent from "@/components/marketplace/hero/useTargetEvent";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
// Legacy modal removed - using Nicole unified interface
import { GiftPathSelector } from "@/components/gifting/unified/GiftPathSelector";
import CreateWishlistDialog from "@/components/gifting/wishlist/CreateWishlistDialog";
import { toast } from "sonner";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const nextHoliday = getNextHoliday();
  const { friendOccasions } = useConnectedFriendsSpecialDates();
  const { targetEvent } = useTargetEvent(user, nextHoliday, [], friendOccasions);
  const [showGiftWizard, setShowGiftWizard] = useState(false);
  const [showCreateWishlist, setShowCreateWishlist] = useState(false);

  // Handler for Start Gifting: routes to gifting approach selection
  const handleStartGifting = () => {
    if (user) {
      // Navigate directly to gifting approach selection
      navigate('/gifting');
    } else {
      // Redirect to auth with gifting as the next destination
      navigate('/auth?redirect=/gifting');
    }
  };

  // Enhanced handler for Create Wishlist CTA
  const handleCreateWishlist = () => {
    if (user) {
      navigate("/wishlists");
    } else {
      navigate("/auth?redirect=/wishlists");
    }
  };
  // Legacy intent handlers removed - Nicole handles all intent selection now

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

      {/* Desktop Countdown Card */}
      {targetEvent && !isMobile && (
        <div className="absolute top-4 right-4 z-20 intersection-target safe-area-inset">
          <GiftCountdown event={targetEvent} />
        </div>
      )}

      {/* Mobile Compact Countdown Banner */}
      {targetEvent && isMobile && (
        <div className="absolute top-0 left-0 right-0 z-20 safe-area-inset-top">
          <GiftCountdown event={targetEvent} />
        </div>
      )}

      {/* Hero Content - Optimized mobile padding */}
      <div className="relative z-10 flex items-center min-h-[80vh] md:min-h-[85vh]">
        <ResponsiveContainer className={`${targetEvent && isMobile ? 'pt-16' : targetEvent ? 'pt-8' : 'pt-8'} safe-area-inset safe-area-inset-top`}>
          <div className="max-w-2xl text-white">
            <h1 className="text-heading-1 md:text-4xl lg:text-5xl text-white mb-6 leading-tight text-shadow-lg no-select">
              Connecting Through Gifting
            </h1>
            <p className="text-body-lg text-gray-100 mb-8 leading-relaxed max-w-xl text-shadow-md no-select">
              Create wishlists, automate gift-giving, and never miss 
              an important celebration again. Our platform handles everything from selection to delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white border-0 text-lg px-8 py-4 shadow-lg touch-target-48 touch-manipulation tap-feedback no-select gpu-accelerated"
                onClick={(e) => {
                  e.preventDefault();
                  handleStartGifting();
                }}
                aria-label="Start Gifting with Nicole AI"
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
                  handleCreateWishlist();
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

      {/* Legacy intent modal removed - Nicole handles all intent selection now */}

      {/* Gift Setup integrated into Nicole AI flow */}

      {/* Nicole Auto-Gifting Test Section (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-purple-100 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">
            🧪 Nicole Auto-Gifting Phase 2 Testing
          </h3>
          <div className="flex gap-4">
            <a 
              href="/nicole-test" 
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Test Nicole Integration
            </a>
            <a 
              href="/nicole-dashboard" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Nicole Dashboard
            </a>
          </div>
        </div>
      )}

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
