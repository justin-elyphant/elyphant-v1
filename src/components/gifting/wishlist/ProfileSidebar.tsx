import React, { useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Package, DollarSign, Heart, ShoppingBag, Menu } from "lucide-react";
import { Wishlist } from "@/types/profile";
import { cn } from "@/lib/utils";

interface ProfileSidebarProps {
  wishlists: Wishlist[];
  categoryFilter: string | null;
  onCategorySelect: (category: string | null) => void;
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
  onCategorySelect 
}) => {
  const { user } = useAuth();
  const { profile } = useProfile();

  // Calculate stats from wishlists
  const stats = useMemo(() => {
    const totalItems = wishlists.reduce((sum, w) => sum + (w.items?.length || 0), 0);
    const totalValue = wishlists.reduce((sum, w) => {
      const wishlistValue = w.items?.reduce((itemSum, item) => itemSum + (item.price || 0), 0) || 0;
      return sum + wishlistValue;
    }, 0);
    
    // Mock purchased data - in real app, this would come from actual purchase tracking
    const purchasedCount = Math.floor(totalItems * 0.25); // Mock: 25% purchased
    const percentPurchased = totalItems > 0 ? (purchasedCount / totalItems) * 100 : 0;

    // Extract unique categories
    const categoryMap = new Map<string, number>();
    wishlists.forEach(wishlist => {
      wishlist.items?.forEach(item => {
        const category = wishlist.category || 'General';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });
    });

    return {
      totalWishlists: wishlists.length,
      totalItems,
      totalValue,
      purchasedCount,
      percentPurchased,
      categories: Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
    };
  }, [wishlists]);

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
            {userName}'s Wishlists
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.totalWishlists} {stats.totalWishlists === 1 ? 'wishlist' : 'wishlists'} • {stats.totalItems} {stats.totalItems === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 space-y-3 border-b border-border">
        <StatCard 
          icon={<Package className="h-4 w-4" />} 
          label="Total Items" 
          value={stats.totalItems} 
        />
        <StatCard 
          icon={<DollarSign className="h-4 w-4" />} 
          label="Total Value" 
          value={`$${stats.totalValue.toFixed(2)}`} 
        />
      </div>

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
                <p className="font-semibold text-sm">{userName}'s Wishlists</p>
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
    </>
  );
};

export default ProfileSidebar;
