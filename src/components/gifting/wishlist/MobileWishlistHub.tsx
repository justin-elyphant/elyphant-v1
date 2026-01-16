import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plus, Heart, ShoppingBag, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wishlist } from "@/types/profile";
import CompactProfileHeader from "./CompactProfileHeader";
import UnifiedWishlistCollectionCard from "./UnifiedWishlistCollectionCard";
import CreateWishlistCard from "./CreateWishlistCard";
import WishlistHeroSection from "./WishlistHeroSection";
import WishlistBenefitsGrid from "./WishlistBenefitsGrid";
import NicoleAISuggestions from "./NicoleAISuggestions";
import { useProducts } from "@/contexts/ProductContext";
import AirbnbStyleProductCard from "@/components/marketplace/AirbnbStyleProductCard";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";

type TabMode = "wishlists" | "shop";

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
  
  // Trending products for Shop tab
  const { products, isLoading: productsLoading } = useProducts();
  const trendingProducts = useMemo(() => products.slice(0, 8), [products]);

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
                activeTab === "shop"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleTabSwitch("shop")}
            >
              <ShoppingBag className="h-4 w-4" />
              Shop to Add
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
              
              {/* Benefits Grid for new users */}
              {wishlists.length < 3 && <WishlistBenefitsGrid className="mt-4" />}

              {/* Nicole AI Suggestions - personalized product carousel */}
              <NicoleAISuggestions maxProducts={6} className="mt-4" />

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

          {/* Shop Tab */}
          {activeTab === "shop" && (
            <div className="space-y-4">
              {/* Header with search prompt */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Trending Products</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use <Search className="h-3 w-3 inline mx-0.5" /> in header to search
                </p>
              </div>

              {/* Trending Products Grid */}
              {trendingProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {trendingProducts.map((product: any) => (
                    <AirbnbStyleProductCard
                      key={product.product_id || product.id}
                      product={product}
                      onProductClick={() => navigate(`/product/${product.product_id || product.id}`)}
                      context="wishlist"
                    />
                  ))}
                </div>
              ) : !productsLoading && (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Discover Products</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the search in the header to find products to add to your wishlists
                  </p>
                  <Button 
                    variant="outline" 
                    className="rounded-xl"
                    onClick={() => navigate('/shop')}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse Shop
                  </Button>
                </div>
              )}

              {/* Loading state */}
              {productsLoading && (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileWishlistHub;
