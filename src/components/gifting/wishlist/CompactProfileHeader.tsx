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

interface VisitorProfileData {
  name: string;
  avatar?: string;
  bio?: string;
  connectionCount?: number;
  wishlistCount?: number;
  itemCount?: number;
  userId: string;
}

interface CompactProfileHeaderProps {
  wishlists: Wishlist[];
  onCreateWishlist: () => void;
  showGiftTracker?: boolean;
  className?: string;
  visitorMode?: boolean;
  visitorProfile?: VisitorProfileData;
  onConnect?: () => void;
  connectionCount?: number;
}

const CompactProfileHeader: React.FC<CompactProfileHeaderProps> = ({
  wishlists,
  onCreateWishlist,
  showGiftTracker = true,
  className,
  visitorMode = false,
  visitorProfile,
  onConnect,
  connectionCount
}) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [percentPurchased, setPercentPurchased] = useState(0);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);

  // Determine display data based on mode
  const displayName = visitorMode && visitorProfile
    ? visitorProfile.name?.split(' ')[0] || "User"
    : (() => {
        if (profile?.first_name) return profile.first_name;
        if (profile?.name) return profile.name.split(' ')[0];
        if (user?.user_metadata?.first_name) return user.user_metadata.first_name;
        if (user?.user_metadata?.name) return user.user_metadata.name.split(' ')[0];
        return "My";
      })();

  const displayAvatar = visitorMode && visitorProfile
    ? visitorProfile.avatar
    : profile?.profile_image || user?.user_metadata?.avatar_url;

  const userInitials = displayName.charAt(0).toUpperCase();

  // Calculate stats
  const stats = useMemo(() => {
    if (visitorMode && visitorProfile) {
      return {
        totalWishlists: visitorProfile.wishlistCount ?? wishlists?.length ?? 0,
        totalItems: visitorProfile.itemCount ?? wishlists?.reduce((sum, w) => sum + (w.items?.length || 0), 0) ?? 0,
        connectionCount: visitorProfile.connectionCount ?? connectionCount ?? 0
      };
    }
    const totalWishlists = wishlists?.length || 0;
    const totalItems = wishlists?.reduce((sum, w) => sum + (w.items?.length || 0), 0) || 0;
    return { totalWishlists, totalItems, connectionCount: connectionCount ?? 0 };
  }, [wishlists, visitorMode, visitorProfile, connectionCount]);

  // Fetch purchase data (only for owner mode)
  useEffect(() => {
    if (visitorMode) return;
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
  }, [wishlists, visitorMode]);

  const handleCreateWishlist = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    onCreateWishlist();
  };

  const handleShare = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    setShareSheetOpen(true);
  };

  // Generate profile URL for sharing
  const profileUrl = visitorMode && visitorProfile
    ? `${window.location.origin}/profile/${visitorProfile.userId}`
    : `${window.location.origin}/profile/${profile?.username ? `@${profile.username}` : user?.id}`;

  // Build stats line
  const statsLine = visitorMode
    ? `${stats.totalWishlists} ${stats.totalWishlists === 1 ? 'wishlist' : 'wishlists'} • ${stats.totalItems} ${stats.totalItems === 1 ? 'item' : 'items'}${stats.connectionCount ? ` • ${stats.connectionCount} connections` : ''}`
    : `${stats.totalWishlists} ${stats.totalWishlists === 1 ? 'wishlist' : 'wishlists'} • ${stats.totalItems} ${stats.totalItems === 1 ? 'item' : 'items'}${connectionCount ? ` • ${connectionCount} connections` : ''}`;

  return (
    <div className={cn("bg-background border-b border-border", className)}>
      {/* Main Profile Row */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={displayAvatar} alt={displayName} />
          <AvatarFallback className="text-sm bg-muted text-foreground">
            {userInitials}
          </AvatarFallback>
        </Avatar>

        {/* Name & Stats */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-foreground truncate">
            {displayName}'s Wishlists
          </h1>
          {visitorMode && visitorProfile?.bio && (
            <p className="text-xs text-muted-foreground truncate mb-0.5">
              {visitorProfile.bio}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {statsLine}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {visitorMode ? (
            <>
              {/* Connect Button for visitors */}
              {onConnect && (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={onConnect}
                    className="h-11 min-h-[44px] px-4 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg"
                  >
                    <Users className="h-4 w-4 mr-1.5" />
                    Connect
                  </Button>
                </motion.div>
              )}
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
            </>
          ) : (
            <>
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

              {/* Create Button - Solid red, Lululemon style */}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={handleCreateWishlist}
                  className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Profile Share Sheet */}
      <ProfileShareSheet
        open={shareSheetOpen}
        onOpenChange={setShareSheetOpen}
        profileName={displayName}
        profileUrl={profileUrl}
        avatarUrl={displayAvatar}
        wishlistCount={stats.totalWishlists}
        itemCount={stats.totalItems}
      />

      {/* Gift Tracker Progress (optional slim bar, owner only) */}
      {!visitorMode && showGiftTracker && stats.totalItems > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <Heart className="h-3 w-3 text-destructive flex-shrink-0" />
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
