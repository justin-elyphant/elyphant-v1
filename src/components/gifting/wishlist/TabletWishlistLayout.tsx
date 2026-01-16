import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wishlist } from "@/types/profile";
import CompactProfileHeader from "./CompactProfileHeader";
import UnifiedWishlistCollectionCard from "./UnifiedWishlistCollectionCard";
import CreateWishlistCard from "./CreateWishlistCard";
import WishlistHeroSection from "./WishlistHeroSection";
import WishlistBenefitsGrid from "./WishlistBenefitsGrid";
import NicoleAISuggestions from "./NicoleAISuggestions";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";

type TabMode = "wishlists" | "nicole";
type SortOption = "recent" | "name" | "items" | "updated";

interface TabletWishlistLayoutProps {
  wishlists: Wishlist[];
  onCreateWishlist: () => void;
  onEditWishlist: (id: string) => void;
  onDeleteWishlist: (id: string) => void;
  onUpdateSharing?: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
}

const TabletWishlistLayout: React.FC<TabletWishlistLayoutProps> = ({
  wishlists,
  onCreateWishlist,
  onEditWishlist,
  onDeleteWishlist,
  onUpdateSharing
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabMode>("wishlists");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  // Calculate total items
  const totalItems = useMemo(() => {
    return wishlists.reduce((acc, w) => acc + (w.items?.length || 0), 0);
  }, [wishlists]);

  // Sort wishlists
  const sortedWishlists = useMemo(() => {
    return [...wishlists].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title);
        case "items":
          return (b.items?.length || 0) - (a.items?.length || 0);
        case "updated":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "recent":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [wishlists, sortBy]);

  // Handle tab switch with haptic
  const handleTabSwitch = (tab: TabMode) => {
    triggerHapticFeedback(HapticPatterns.tabSwitch);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Profile Header */}
      <CompactProfileHeader 
        wishlists={wishlists}
        onCreateWishlist={onCreateWishlist}
        showGiftTracker={true}
        className="sticky top-0 z-40"
      />

      {/* Tab Toggle - matching mobile style */}
      <div className="sticky top-[72px] z-30 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="px-6 py-3">
          <div className="flex bg-muted/50 rounded-xl p-1 max-w-md">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-10 min-h-[44px] rounded-lg text-sm font-medium transition-all gap-2 touch-manipulation",
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
                "flex-1 h-10 min-h-[44px] rounded-lg text-sm font-medium transition-all gap-2 touch-manipulation",
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

      {/* Content based on active tab */}
      {activeTab === "nicole" ? (
        /* Nicole AI Tab - Full Experience */
        <div className="px-6 py-6">
          <NicoleAISuggestions maxProducts={12} variant="full" />
        </div>
      ) : (
        /* Wishlists Tab */
        <>
          {/* Hero Section for Tablet */}
          <div className="px-6 py-6 space-y-6">
            <WishlistHeroSection 
              wishlistCount={wishlists.length}
              totalItemCount={totalItems}
              onCreateWishlist={onCreateWishlist}
            />
            
            {wishlists.length < 3 && <WishlistBenefitsGrid />}
          </div>

          {/* Sort Bar */}
          <div className="px-6 pb-4">
            <div className="flex justify-end">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[160px] h-10 rounded-lg">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="items">Most Items</SelectItem>
                  <SelectItem value="updated">Last Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 pb-6">
            {/* Wishlists Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Wishlists</h2>

              {sortedWishlists.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {sortedWishlists.map((wishlist) => (
                    <UnifiedWishlistCollectionCard
                      key={wishlist.id}
                      wishlist={wishlist}
                      variant="tablet"
                      onEdit={onEditWishlist}
                      onDelete={onDeleteWishlist}
                      onUpdateSharing={onUpdateSharing}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex justify-center py-12">
                  <CreateWishlistCard onCreateNew={onCreateWishlist} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TabletWishlistLayout;