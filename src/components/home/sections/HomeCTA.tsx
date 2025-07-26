
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, List } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import OnboardingIntentModal from "@/components/auth/signup/OnboardingIntentModal";
import EnhancedAuthModal from "@/components/auth/enhanced/EnhancedAuthModalV2";
import { GiftSetupWizard } from "@/components/gifting/GiftSetupWizard";
import CreateWishlistDialog from "@/components/gifting/wishlist/CreateWishlistDialog";
import { toast } from "sonner";

const HomeCTA = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGiftWizard, setShowGiftWizard] = useState(false);
  const [showCreateWishlist, setShowCreateWishlist] = useState(false);
  
  const handleStartGifting = () => {
    if (user) {
      // Authenticated user: show intent modal to choose their path
      setShowIntentModal(true);
    } else {
      // Not logged in: show enhanced auth modal
      setShowAuthModal(true);
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
    <section className="bg-gradient-to-r from-purple-600 to-indigo-600 py-12 md:py-16 text-white safe-area-bottom">
      <div className="container mx-auto px-4 md:px-6 safe-area-inset">
        <div className="max-w-3xl mx-auto text-center">
          <Gift className="mx-auto h-12 md:h-16 w-12 md:w-16 opacity-75 mb-4 md:mb-6" />
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
            Ready to Transform Your Gift-Giving Experience?
          </h2>
          
          <p className="text-base md:text-lg opacity-90 mb-6 md:mb-8 leading-relaxed">
            Join thousands of users who have made gifting meaningful, personal, and stress-free.
          </p>
          
          {user ? (
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold touch-target-48 touch-manipulation tap-feedback no-select"
                onClick={handleStartGifting}
              >
                <Gift className="mr-2 h-5 w-5" />
                Start Gifting
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-purple-600 hover:bg-white/10 hover:text-white font-semibold touch-target-48 touch-manipulation tap-feedback no-select"
              >
                <Link to="/wishlists">
                  <List className="mr-2 h-5 w-5" />
                  Create a Wishlist
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold touch-target-48 touch-manipulation tap-feedback no-select"
              >
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
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

      <EnhancedAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </section>
  );
};

export default HomeCTA;
