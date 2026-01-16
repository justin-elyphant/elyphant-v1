import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Search, X, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  // Calculate total items
  const totalItems = useMemo(() => {
    return wishlists.reduce((acc, w) => acc + (w.items?.length || 0), 0);
  }, [wishlists]);

  // Filter and sort wishlists
  const filteredAndSortedWishlists = useMemo(() => {
    let filtered = wishlists;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = wishlists.filter(wishlist =>
        wishlist.title.toLowerCase().includes(query) ||
        wishlist.description?.toLowerCase().includes(query)
      );
    }

    // Apply sort
    return [...filtered].sort((a, b) => {
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
  }, [wishlists, searchQuery, sortBy]);

  // Handle view mode toggle with haptic
  const handleViewModeChange = (mode: ViewMode) => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    setViewMode(mode);
  };

  // Clear search
  const clearSearch = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    setSearchQuery("");
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

      {/* Search & Controls Bar - Consistent with Desktop */}
      <div className="sticky top-[72px] z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Search - Wishlist only */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search wishlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-10 rounded-xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 rounded-full"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

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

            {/* Inline Sort Dropdown - Consistent with Desktop */}
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
          <h2 className="text-xl font-semibold mb-4">
            {searchQuery ? `Wishlists matching "${searchQuery}"` : "Your Wishlists"}
          </h2>

          {filteredAndSortedWishlists.length > 0 ? (
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-2 gap-4" 
                : "space-y-4"
            )}>
              {filteredAndSortedWishlists.map((wishlist) => (
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
          ) : wishlists.length === 0 ? (
            <div className="flex justify-center py-12">
              <CreateWishlistCard onCreateNew={onCreateWishlist} />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No wishlists match "{searchQuery}"</p>
              <Button variant="outline" onClick={clearSearch}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabletWishlistLayout;