import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Heart, Share2 } from "lucide-react";
import { Wishlist } from "@/types/profile";
import { WishlistPurchaseTrackingService } from "@/services/wishlistPurchaseTracking";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import ProfileShareSheet from "@/components/user-profile/ProfileShareSheet";

interface CompactProfileHeaderProps {
  wishlists: Wishlist[];
  onCreateWishlist: () => void;
  showGiftTracker?: boolean;
  className?: string;
}

const CompactProfileHeader: React.FC<CompactProfileHeaderProps> = ({
  wishlists,
  onCreateWishlist,
  showGiftTracker = true,
  className
}) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [percentPurchased, setPercentPurchased] = useState(0);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  // Get user display name
  const getUserName = () => {
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (profile?.name) {
      return profile.name.split(' ')[0];
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.split(' ')[0];
    }
    return "My";
  };

  const userName = getUserName();
  const avatarUrl = profile?.profile_image || user?.user_metadata?.avatar_url;
  const userInitials = userName.charAt(0).toUpperCase();

  // Calculate stats
  const stats = useMemo(() => {
    const totalWishlists = wishlists?.length || 0;
    const totalItems = wishlists?.reduce((sum, w) => sum + (w.items?.length || 0), 0) || 0;
    return { totalWishlists, totalItems };
  }, [wishlists]);

  // Fetch purchase data
  useEffect(() => {
    const fetchPurchaseData = async () => {
      if (!wishlists || wishlists.length === 0) return;

      const wishlistIds = wishlists.map(w => w.id);
      const allItems = wishlists.flatMap(w => 
        (w.items || []).map(item => ({
          id: item.id,
          price: item.price,
          category: w.category
        }))
      );

      const purchaseStats = await WishlistPurchaseTrackingService.getWishlistStats({
        wishlistIds,
        items: allItems
      });

      setPurchasedCount(purchaseStats.purchasedCount);
      setPercentPurchased(purchaseStats.percentPurchased);
    };

    fetchPurchaseData();
  }, [wishlists]);

  const handleCreateWishlist = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    onCreateWishlist();
  };

  const handleShare = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    setShareSheetOpen(true);
  };

  // Generate profile URL for sharing
  const profileUrl = `${window.location.origin}/profile/${profile?.username ? `@${profile.username}` : user?.id}`;

  return (
    <div className={cn("bg-background border-b border-border", className)}>
      {/* Main Profile Row */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={avatarUrl} alt={userName} />
          <AvatarFallback className="text-sm bg-primary/10 text-primary">
            {userInitials}
          </AvatarFallback>
        </Avatar>

        {/* Name & Stats */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-foreground truncate">
            {userName}'s Wishlists
          </h1>
          <p className="text-xs text-muted-foreground">
            {stats.totalWishlists} {stats.totalWishlists === 1 ? 'wishlist' : 'wishlists'} • {stats.totalItems} {stats.totalItems === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Share Button */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline"
              onClick={handleShare}
              className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-full"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Create Button - Gradient FAB with iOS compliance */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={handleCreateWishlist}
              className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-full bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-700 hover:to-sky-600 shadow-lg"
            >
              <Plus className="h-5 w-5 text-white" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Profile Share Sheet */}
      <ProfileShareSheet
        open={shareSheetOpen}
        onOpenChange={setShareSheetOpen}
        profileName={userName}
        profileUrl={profileUrl}
        avatarUrl={avatarUrl}
        wishlistCount={stats.totalWishlists}
        itemCount={stats.totalItems}
      />

      {/* Gift Tracker Progress (optional slim bar) */}
      {showGiftTracker && stats.totalItems > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <Heart className="h-3 w-3 text-primary flex-shrink-0" />
            <Progress value={percentPurchased} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {Math.round(percentPurchased)}% gifted
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactProfileHeader;
