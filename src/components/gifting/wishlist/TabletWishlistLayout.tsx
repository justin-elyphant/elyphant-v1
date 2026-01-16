import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Grid3X3, List } from "lucide-react";
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

type ViewMode = "grid" | "list";
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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
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

  // Handle view mode toggle with haptic
  const handleViewModeChange = (mode: ViewMode) => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    setViewMode(mode);
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

      {/* Hero Section for Tablet */}
      <div className="px-6 py-6 space-y-6">
        <WishlistHeroSection 
          wishlistCount={wishlists.length}
          totalItemCount={totalItems}
          onCreateWishlist={onCreateWishlist}
        />
        
        {wishlists.length < 3 && <WishlistBenefitsGrid />}
        
        {/* Nicole AI Suggestions */}
        <NicoleAISuggestions maxProducts={6} />
      </div>

      {/* Controls Bar - View Toggle & Sort */}
      <div className="sticky top-[72px] z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-muted/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 rounded-md min-h-[44px] min-w-[44px] touch-manipulation",
                  viewMode === "grid" ? "bg-background shadow-sm" : ""
                )}
                onClick={() => handleViewModeChange("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 rounded-md min-h-[44px] min-w-[44px] touch-manipulation",
                  viewMode === "list" ? "bg-background shadow-sm" : ""
                )}
                onClick={() => handleViewModeChange("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Sort Dropdown */}
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
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Wishlists Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Wishlists</h2>

          {sortedWishlists.length > 0 ? (
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-2 gap-4" 
                : "space-y-4"
            )}>
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
    </div>
  );
};

export default TabletWishlistLayout;