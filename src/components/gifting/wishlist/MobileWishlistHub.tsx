import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plus, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wishlist } from "@/types/profile";
import CompactProfileHeader from "./CompactProfileHeader";
import UnifiedWishlistCollectionCard from "./UnifiedWishlistCollectionCard";
import WishlistHeroSection from "./WishlistHeroSection";
import WishlistBenefitsGrid from "./WishlistBenefitsGrid";
import NicoleAISuggestions from "./NicoleAISuggestions";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";

type TabMode = "wishlists" | "nicole";

interface MobileWishlistHubProps {
  wishlists: Wishlist[];
  onCreateWishlist: () => void;
  onEditWishlist: (id: string) => void;
  onDeleteWishlist: (id: string) => void;
  onUpdateSharing?: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
}

const MobileWishlistHub: React.FC<MobileWishlistHubProps> = ({
  wishlists,
  onCreateWishlist,
  onEditWishlist,
  onDeleteWishlist,
  onUpdateSharing
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabMode>("wishlists");

  // Calculate total items for hero
  const totalItems = useMemo(() => {
    return wishlists.reduce((acc, w) => acc + (w.items?.length || 0), 0);
  }, [wishlists]);



  // Handle tab switch with haptic
  const handleTabSwitch = (tab: TabMode) => {
    triggerHapticFeedback(HapticPatterns.tabSwitch);
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header Zone */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="safe-area-top" />
        
        {/* Compact Profile Header */}
        <CompactProfileHeader 
          wishlists={wishlists}
          onCreateWishlist={onCreateWishlist}
          showGiftTracker={true}
        />

        {/* Tab Toggle */}
        <div className="px-4 py-2 border-b border-border/30">
          <div className="flex bg-muted/50 rounded-xl p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-9 min-h-[44px] rounded-lg text-sm font-medium transition-all gap-2 touch-manipulation",
                activeTab === "wishlists"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleTabSwitch("wishlists")}
            >
              <Heart className="h-4 w-4" />
              My Wishlists
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-9 min-h-[44px] rounded-lg text-sm font-medium transition-all gap-2 touch-manipulation",
                activeTab === "nicole"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleTabSwitch("nicole")}
            >
              <Sparkles className="h-4 w-4" />
              Nicole AI
            </Button>
          </div>
        </div>
      </div>

      {/* Content Zone */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div 
          className="px-4 py-4"
          style={{ 
            paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))' 
          }}
        >
          {/* My Wishlists Tab */}
          {activeTab === "wishlists" && (
            <div className="space-y-4">
              {/* Hero Section - Always visible on mobile */}
              <WishlistHeroSection
                wishlistCount={wishlists.length}
                totalItemCount={totalItems}
                onCreateWishlist={onCreateWishlist}
                variant="mobile"
              />
              

              {/* Wishlists Grid */}
              {wishlists.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {wishlists.map((wishlist) => (
                    <UnifiedWishlistCollectionCard
                      key={wishlist.id}
                      wishlist={wishlist}
                      variant="mobile"
                      onEdit={onEditWishlist}
                      onDelete={onDeleteWishlist}
                      onUpdateSharing={onUpdateSharing}
                    />
                  ))}
                </div>
              ) : (
                /* Empty State - First Wishlist CTA */
                <div className="pt-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600/20 to-sky-500/20 flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Start Your First Wishlist</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Create wishlists and share them with friends and family for any occasion.
                    </p>
                  </div>
                  <Button 
                    onClick={onCreateWishlist}
                    className="w-full h-12 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Wishlist
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Nicole AI Tab - Full Recommendation Engine */}
          {activeTab === "nicole" && (
            <NicoleAISuggestions maxProducts={16} variant="full" className="" />
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileWishlistHub;
