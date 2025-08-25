
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Gift, 
  Users, 
  Brain, 
  Settings, 
  Heart, 
  ShoppingBag, 
  Calendar,
  ArrowRight,
  Zap,
  Plus,
  Search
} from "lucide-react";
import ProfileDataIntegrityPanel from "@/components/settings/ProfileDataIntegrityPanel";
import QuickGiftCTA from "./QuickGiftCTA";
import { useAuth } from "@/contexts/auth";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { useIsMobile } from "@/hooks/use-mobile";
import { SwipeableCard } from "@/components/mobile/SwipeableCard";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { MobileActionBar } from "@/components/mobile/MobileActionBar";
import { cn } from "@/lib/utils";

const DashboardGrid = () => {
  const { user } = useAuth();
  const { connectionStats } = useActivityFeed(5);
  const { wishlists } = useUnifiedWishlistSystem();
  const isMobile = useIsMobile();
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const wishlistCount = wishlists?.length || 0;
  const totalWishlistItems = wishlists?.reduce((total, wishlist) => 
    total + (wishlist.items?.length || 0), 0) || 0;

  const handleCardSwipe = (direction: 'left' | 'right', cardType: string) => {
    console.log(`Swiped ${direction} on ${cardType} card`);
    // Could implement quick actions based on swipe direction
  };

  const quickActions = [
    {
      label: 'Quick Gift',
      icon: <Gift className="h-4 w-4" />,
      onClick: () => setShowQuickActions(false),
      primary: true,
    },
    {
      label: 'Browse',
      icon: <Search className="h-4 w-4" />,
      onClick: () => setShowQuickActions(false),
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Data Integrity Panel - Top Priority */}
      <ProfileDataIntegrityPanel />

      {/* Quick Gift Setup CTA */}
      <QuickGiftCTA />

      {/* Quick Stats Overview - Mobile Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="text-center hover:shadow-sm transition-shadow touch-manipulation">
          <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-2 sm:px-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary line-clamp-1">{connectionStats.accepted}</div>
            <div className="text-xs text-muted-foreground line-clamp-1">Friends</div>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:shadow-sm transition-shadow touch-manipulation">
          <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-2 sm:px-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary line-clamp-1">{wishlistCount}</div>
            <div className="text-xs text-muted-foreground line-clamp-1">Lists</div>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:shadow-sm transition-shadow touch-manipulation">
          <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-2 sm:px-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary line-clamp-1">{totalWishlistItems}</div>
            <div className="text-xs text-muted-foreground line-clamp-1">Items</div>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:shadow-sm transition-shadow touch-manipulation">
          <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-2 sm:px-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 line-clamp-1">{connectionStats.pending}</div>
            <div className="text-xs text-muted-foreground line-clamp-1">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards - Mobile Optimized with Swipe Support */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Gifting Hub */}
        <SwipeableCard 
          className={cn(
            "hover:shadow-lg transition-all duration-200 cursor-pointer group",
            "touch-manipulation min-h-[140px] sm:min-h-[130px]"
          )}
          onSwipeLeft={() => handleCardSwipe('left', 'gifting')}
          onSwipeRight={() => handleCardSwipe('right', 'gifting')}
          disabled={!isMobile}
        >
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
              <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="line-clamp-1">Gifting Hub</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              Events, auto-gifting & groups
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                Schedule gifts, set up automation, and coordinate group gifts
              </div>
              <Button asChild className="w-full touch-target-44 text-xs sm:text-sm h-8 sm:h-10">
                <Link to="/gifting">
                  <span className="hidden sm:inline">Open Gifting Hub</span>
                  <span className="sm:hidden">Open Hub</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </SwipeableCard>

        {/* Social Hub */}
        <SwipeableCard 
          className={cn(
            "hover:shadow-lg transition-all duration-200 cursor-pointer group",
            "touch-manipulation min-h-[140px] sm:min-h-[130px]"
          )}
          onSwipeLeft={() => handleCardSwipe('left', 'social')}
          onSwipeRight={() => handleCardSwipe('right', 'social')}
          disabled={!isMobile}
        >
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="line-clamp-1">Social Hub</span>
              {connectionStats.pending > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs h-4 px-1">
                  {connectionStats.pending}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              Friends & connections
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                View activity, manage connections, and send messages
              </div>
              <Button asChild className="w-full touch-target-44 text-xs sm:text-sm h-8 sm:h-10">
                <Link to="/social">
                  <span className="hidden sm:inline">Open Social Hub</span>
                  <span className="sm:hidden">Open Social</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </SwipeableCard>

        {/* Nicole AI */}
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[140px] sm:min-h-[130px]"
        )}>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="line-clamp-1">Nicole AI</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              AI gift assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                Get personalized recommendations and insights
              </div>
              <Button asChild className="w-full touch-target-44 text-xs sm:text-sm h-8 sm:h-10">
                <Link to="/nicole">
                  <span className="hidden sm:inline">Chat with Nicole</span>
                  <span className="sm:hidden">Chat</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace */}
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[140px] sm:min-h-[130px]"
        )}>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="line-clamp-1">Marketplace</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              Shop for gifts
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                Browse products and find the perfect gifts
              </div>
              <Button asChild variant="outline" className="w-full touch-target-44 text-xs sm:text-sm h-8 sm:h-10">
                <Link to="/marketplace">
                  <span className="hidden sm:inline">Browse Products</span>
                  <span className="sm:hidden">Browse</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Wishlists */}
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[140px] sm:min-h-[130px]"
        )}>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="line-clamp-1">Wishlists</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              Your collections
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                Create and share wishlists with friends
              </div>
              <Button asChild variant="outline" className="w-full touch-target-44 text-xs sm:text-sm h-8 sm:h-10">
                <Link to="/wishlists">
                  <span className="hidden sm:inline">View Wishlists</span>
                  <span className="sm:hidden">View Lists</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[140px] sm:min-h-[130px]"
        )}>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="line-clamp-1">Account</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              Settings & privacy
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                Update profile, privacy, and preferences
              </div>
              <Button asChild variant="outline" className="w-full touch-target-44 text-xs sm:text-sm h-8 sm:h-10">
                <Link to="/account">
                  <span className="hidden sm:inline">Account Settings</span>
                  <span className="sm:hidden">Settings</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Action Bar - One-handed use optimization */}
      {isMobile && (
        <>
          <MobileActionBar
            actions={[
              {
                label: 'Quick Actions',
                icon: <Plus className="h-4 w-4" />,
                onClick: () => setShowQuickActions(true),
                primary: true,
              },
              {
                label: 'Search',
                icon: <Search className="h-4 w-4" />,
                onClick: () => {/* Navigate to search */},
                variant: 'outline',
              },
            ]}
          />

          {/* Mobile Bottom Sheet for Quick Actions */}
          <MobileBottomSheet
            isOpen={showQuickActions}
            onClose={() => setShowQuickActions(false)}
            title="Quick Actions"
            snapPoints={[40, 70]}
            initialSnapPoint={0}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button asChild className="h-16 flex-col gap-1 touch-target-44">
                  <Link to="/gifting">
                    <Gift className="h-6 w-6" />
                    <span className="text-xs">New Gift</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col gap-1 touch-target-44">
                  <Link to="/marketplace">
                    <Search className="h-6 w-6" />
                    <span className="text-xs">Browse</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col gap-1 touch-target-44">
                  <Link to="/social">
                    <Users className="h-6 w-6" />
                    <span className="text-xs">Friends</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col gap-1 touch-target-44">
                  <Link to="/nicole">
                    <Brain className="h-6 w-6" />
                    <span className="text-xs">Ask Nicole</span>
                  </Link>
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground text-center mt-4">
                💡 Swipe left or right on cards above for quick actions
              </div>
            </div>
          </MobileBottomSheet>
        </>
      )}
    </div>
  );
};

export default DashboardGrid;
