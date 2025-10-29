import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Package, DollarSign, Heart, ShoppingBag, Menu, Plus, Eye, Share2, Settings } from "lucide-react";
import { Wishlist } from "@/types/profile";
import { cn } from "@/lib/utils";
import { WishlistPurchaseTrackingService } from "@/services/wishlistPurchaseTracking";
import { useNavigate } from "react-router-dom";
import { useProfileSharing } from "@/hooks/useProfileSharing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileSidebarProps {
  wishlists: Wishlist[];
  categoryFilter: string | null;
  onCategorySelect: (category: string | null) => void;
  onCreateWishlist?: () => void;
  selectedWishlistId?: string | null;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, className }) => (
  <div className={cn("flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/40", className)}>
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold truncate">{value}</p>
    </div>
  </div>
);

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ 
  wishlists, 
  categoryFilter, 
  onCategorySelect,
  onCreateWishlist,
  selectedWishlistId
}) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  // Setup profile sharing
  const { quickShare, profileUrl } = useProfileSharing({
    profileId: profile?.id || user?.id || "",
    profileName: profile?.name || userName,
    profileUsername: profile?.username
  });

  // Bulk privacy update handler
  const handleBulkPrivacyUpdate = async (makePublic: boolean) => {
    if (!user?.id) return;
    
    const { error } = await supabase
      .from('wishlists')
      .update({ is_public: makePublic })
      .eq('user_id', user.id);
    
    if (error) {
      toast.error("Failed to update wishlists");
      return;
    }
    
    toast.success(`All wishlists set to ${makePublic ? "public" : "private"}`);
    setSettingsOpen(false);
  };

  // Navigation handlers
  const handlePreviewAsGuest = () => {
    const profilePath = profile?.username 
      ? `/profile/${profile.username}` 
      : `/profile/${profile?.id || user?.id}`;
    navigate(profilePath);
  };

  const handleSettings = () => {
    setSettingsOpen(true);
  };

  // Filter wishlists based on selection
  const filteredWishlists = useMemo(() => {
    if (selectedWishlistId) {
      return wishlists.filter(w => w.id === selectedWishlistId);
    }
    return wishlists;
  }, [wishlists, selectedWishlistId]);

  // Get selected wishlist for title display
  const selectedWishlist = useMemo(() => {
    if (selectedWishlistId) {
      return wishlists.find(w => w.id === selectedWishlistId);
    }
    return null;
  }, [wishlists, selectedWishlistId]);

  // Fetch real purchase data
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [percentPurchased, setPercentPurchased] = useState(0);

  useEffect(() => {
    const fetchPurchaseData = async () => {
      if (!filteredWishlists || filteredWishlists.length === 0) return;

      const wishlistIds = filteredWishlists.map(w => w.id);
      const allItems = filteredWishlists.flatMap(w => 
        (w.items || []).map(item => ({
          id: item.id,
          price: item.price,
          category: w.category
        }))
      );

      const stats = await WishlistPurchaseTrackingService.getWishlistStats({
        wishlistIds,
        items: allItems
      });

      setPurchasedCount(stats.purchasedCount);
      setPercentPurchased(stats.percentPurchased);
    };

    fetchPurchaseData();
  }, [filteredWishlists]);

  // Calculate stats from filtered wishlists
  const stats = useMemo(() => {
    const totalItems = filteredWishlists.reduce((sum, w) => sum + (w.items?.length || 0), 0);
    const totalValue = filteredWishlists.reduce((sum, w) => {
      const wishlistValue = w.items?.reduce((itemSum, item) => itemSum + (item.price || 0), 0) || 0;
      return sum + wishlistValue;
    }, 0);

    // Extract unique categories
    const categoryMap = new Map<string, number>();
    filteredWishlists.forEach(wishlist => {
      wishlist.items?.forEach(item => {
        const category = wishlist.category || 'General';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });
    });

    return {
      totalWishlists: filteredWishlists.length,
      totalItems,
      totalValue,
      purchasedCount,
      percentPurchased,
      categories: Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
    };
  }, [filteredWishlists, purchasedCount, percentPurchased]);

  const avatarUrl = profile?.profile_image || user?.user_metadata?.avatar_url;
  const userInitials = userName.charAt(0).toUpperCase();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sidebar content component
  const SidebarContent = () => (
    <>
      {/* Profile Section */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold">
            {selectedWishlist ? selectedWishlist.title : `${userName}'s Wishlists`}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedWishlist 
              ? `${stats.totalItems} ${stats.totalItems === 1 ? 'item' : 'items'}`
              : `${stats.totalWishlists} ${stats.totalWishlists === 1 ? 'wishlist' : 'wishlists'} • ${stats.totalItems} ${stats.totalItems === 1 ? 'item' : 'items'}`
            }
          </p>
          {onCreateWishlist && (
            <Button onClick={onCreateWishlist} className="w-full mt-4" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Wishlist
            </Button>
          )}
        </div>
      </div>

      {/* Wishlist Actions - Only show when a specific wishlist is selected */}
      {selectedWishlistId && (
        <div className="p-4 border-b border-border space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handlePreviewAsGuest}
          >
            <Eye className="h-4 w-4" />
            Preview as Guest
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={quickShare}
          >
            <Share2 className="h-4 w-4" />
            Share Profile
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleSettings}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      )}

      {/* Gift Tracker */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Gift Tracker</h3>
        </div>
        <Progress value={stats.percentPurchased} className="h-2 mb-2" />
        <p className="text-xs text-muted-foreground">
          {stats.purchasedCount} of {stats.totalItems} purchased ({Math.round(stats.percentPurchased)}%)
        </p>
      </div>

      {/* Stats Overview */}
      <div className="p-4 border-b border-border space-y-2">
        <StatCard
          icon={<Heart className="h-5 w-5" />}
          label="Active Wishlists"
          value={stats.totalWishlists}
        />
        <StatCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Total Items"
          value={stats.totalItems}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Value"
          value={`$${stats.totalValue.toFixed(0)}`}
        />
      </div>

      {/* Categories */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Categories</h3>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => {
              onCategorySelect(null);
              setIsMobileOpen(false);
            }}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
              categoryFilter === null
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center justify-between">
              <span>All Items</span>
              <Badge variant="secondary" className="text-xs">
                {stats.totalItems}
              </Badge>
            </div>
          </button>
          {stats.categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => {
                onCategorySelect(cat.name);
                setIsMobileOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                categoryFilter === cat.name
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{cat.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {cat.count}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: Sheet Drawer */}
      <div className="md:hidden">
        {/* Mobile Header with Avatar and Menu */}
        <div className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback className="text-sm bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">
                  {selectedWishlist ? selectedWishlist.title : `${userName}'s Wishlists`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalItems} items
                </p>
              </div>
            </div>
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 overflow-y-auto">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Mobile Categories - Horizontal Scroll */}
          <div className="px-4 pb-3 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              <Badge
                variant={categoryFilter === null ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => onCategorySelect(null)}
              >
                All ({stats.totalItems})
              </Badge>
              {stats.categories.map((cat) => (
                <Badge
                  key={cat.name}
                  variant={categoryFilter === cat.name ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => onCategorySelect(cat.name)}
                >
                  {cat.name} ({cat.count})
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Fixed Sidebar */}
      <div className="hidden md:block w-[280px] bg-background border-r border-border flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent />
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wishlist Privacy Settings</DialogTitle>
            <DialogDescription>
              Apply privacy settings to all your wishlists at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button 
              className="w-full" 
              onClick={() => handleBulkPrivacyUpdate(true)}
            >
              Make All Wishlists Public
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => handleBulkPrivacyUpdate(false)}
            >
              Make All Wishlists Private
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileSidebar;
