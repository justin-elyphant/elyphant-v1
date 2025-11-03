
import React, { useState, useEffect } from "react";
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
  Search,
  MessageCircle
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
import { supabase } from "@/integrations/supabase/client";
import MobileDashboardGrid from "./MobileDashboardGrid";
import { cn } from "@/lib/utils";
import { SecurityDashboardWidget } from "./SecurityDashboardWidget";

const DashboardGrid = () => {
  const { user } = useAuth();
  const { connectionStats } = useActivityFeed(5);
  const { wishlists } = useUnifiedWishlistSystem();
  const isMobile = useIsMobile();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [processingOrdersCount, setProcessingOrdersCount] = useState(0);
  
  const wishlistCount = wishlists?.length || 0;

  // Fetch active orders count (orders user is actively waiting for)
  useEffect(() => {
    const fetchActiveOrders = async () => {
      if (!user) return;
      
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, status')
          .eq('user_id', user.id)
          .in('status', ['pending', 'processing', 'submitted_to_zinc', 'confirmed', 'retry_pending', 'shipped']);
        
        setProcessingOrdersCount(orders?.length || 0);
      } catch (error) {
        console.error('Error fetching active orders:', error);
      }
    };

    fetchActiveOrders();

    // Set up realtime subscription for order status changes
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          // Refetch orders when any order changes
          fetchActiveOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [user]);

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

  // Use new mobile grid on mobile devices
  if (isMobile) {
    return <MobileDashboardGrid />;
  }

  return (
    <div className={cn(
      "space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden"
    )}>
      {/* Onboarding Hint for New Navigation */}
      {user && (
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground mb-1">Welcome to your Account Hub!</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                All your features are now accessible from this central dashboard. Tap the Account tab at the bottom to return here anytime.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Data Integrity Panel - Top Priority */}
      <ProfileDataIntegrityPanel />

      {/* Security Dashboard Widget */}
      <SecurityDashboardWidget />

      {/* Quick Gift Setup CTA */}
      <QuickGiftCTA />

      {/* Quick Stats Overview - Mobile Optimized */}
      <div className={cn(
        "grid gap-3 sm:gap-4 w-full",
        isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
      )}>
        <Link to="/connections">
          <Card className={cn(
            "text-center hover:shadow-md transition-shadow touch-manipulation min-w-0 max-w-full mobile-card cursor-pointer",
            isMobile && "gpu-accelerated"
          )}>
            <CardContent className={cn(
              "pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-6",
              isMobile && "px-2"
            )}>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary line-clamp-1">{connectionStats.accepted}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">Friends</div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/wishlists">
          <Card className={cn(
            "text-center hover:shadow-md transition-shadow touch-manipulation min-w-0 max-w-full mobile-card cursor-pointer",
            isMobile && "gpu-accelerated"
          )}>
            <CardContent className={cn(
              "pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-6",
              isMobile && "px-2"
            )}>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary line-clamp-1">{wishlistCount}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">Wishlists</div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/orders">
          <Card className={cn(
            "text-center hover:shadow-md transition-shadow touch-manipulation min-w-0 max-w-full mobile-card cursor-pointer",
            isMobile && "gpu-accelerated"
          )}>
            <CardContent className={cn(
              "pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-6",
              isMobile && "px-2"
            )}>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary line-clamp-1">{processingOrdersCount}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">Orders</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Features - Account-Centric Layout */}
      <div className="space-y-6">
        {/* Primary Actions - Top Priority */}
        <div className={cn(
          "grid gap-4 w-full max-w-full",
          isMobile ? "grid-cols-1 space-y-4" : "grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
        )}>
          {/* Marketplace */}
          <Card className={cn(
            "hover:shadow-lg transition-all duration-200 cursor-pointer group",
            "touch-manipulation min-h-[120px] sm:min-h-[140px] border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
          )}>
            <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-lg sm:text-xl">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="line-clamp-1">Browse & Shop</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base line-clamp-2">
                Discover products & find perfect gifts
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <Button asChild className="w-full touch-target-44 text-sm h-10 min-w-0">
                <Link to="/marketplace" className="flex items-center justify-center gap-2">
                  <span>Explore Marketplace</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Gifting Hub */}
          <SwipeableCard 
            className={cn(
              "hover:shadow-lg transition-all duration-200 cursor-pointer group",
              "touch-manipulation min-h-[120px] sm:min-h-[140px] border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10"
            )}
            onSwipeLeft={() => handleCardSwipe('left', 'gifting')}
            onSwipeRight={() => handleCardSwipe('right', 'gifting')}
            disabled={!isMobile}
          >
            <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-lg sm:text-xl">
                <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="line-clamp-1">Gifting Hub</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base line-clamp-2">
                Events, auto-gifting & groups
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <Button asChild className="w-full touch-target-44 text-sm h-10 min-w-0">
                <Link to="/gifting" className="flex items-center justify-center gap-2">
                  <span>Open Gifting</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </Link>
              </Button>
            </CardContent>
          </SwipeableCard>
        </div>

        {/* Secondary Features */}
        <div className={cn(
          "grid gap-4 w-full max-w-full",
          isMobile ? "grid-cols-1 space-y-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 lg:gap-6"
        )}>

        {/* Connections */}
        <SwipeableCard 
          className={cn(
            "hover:shadow-lg transition-all duration-200 cursor-pointer group",
            "touch-manipulation min-h-[140px] sm:min-h-[130px]"
          )}
          onSwipeLeft={() => handleCardSwipe('left', 'connections')}
          onSwipeRight={() => handleCardSwipe('right', 'connections')}
          disabled={!isMobile}
        >
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="line-clamp-1">Connections</span>
              {connectionStats.pending > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs h-4 px-1">
                  {connectionStats.pending}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              Friends & networking
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                Manage your friend connections
              </div>
              <Button asChild className="w-full touch-target-44 text-xs sm:text-sm h-9 sm:h-10 min-w-0">
                <Link to="/connections" className="flex items-center justify-center truncate">
                  <span className="hidden sm:inline truncate">View Connections</span>
                  <span className="sm:hidden truncate">Connections</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </SwipeableCard>

        {/* Temporarily hidden - Nicole AI
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[140px] sm:min-h-[130px]"
        )}>
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="line-clamp-1">Nicole AI</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              AI gift assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                Get personalized recommendations and insights
              </div>
              <Button asChild className="w-full touch-target-44 text-xs sm:text-sm h-9 sm:h-10 min-w-0">
                <Link to="/nicole" className="flex items-center justify-center truncate">
                  <span className="hidden sm:inline truncate">Chat with Nicole</span>
                  <span className="sm:hidden truncate">Nicole</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        */}

        {/* Messages */}
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[140px] sm:min-h-[130px]"
        )}>
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="line-clamp-1">Messages</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              Chat with friends
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                Send messages to your connections
              </div>
              <Button asChild variant="outline" className="w-full touch-target-44 text-xs sm:text-sm h-9 sm:h-10 min-w-0">
                <Link to="/messages" className="flex items-center justify-center truncate">
                  <span className="hidden sm:inline truncate">View Messages</span>
                  <span className="sm:hidden truncate">Messages</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
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
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="line-clamp-1">Wishlists</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              Your collections
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                Create and share wishlists with friends
              </div>
              <Button asChild variant="outline" className="w-full touch-target-44 text-xs sm:text-sm h-9 sm:h-10 min-w-0">
                <Link to="/wishlists" className="flex items-center justify-center truncate">
                  <span className="hidden sm:inline truncate">View Wishlists</span>
                  <span className="sm:hidden truncate">Lists</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
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
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="line-clamp-1">Account Settings</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              Profile, privacy & preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                Update profile, privacy, and preferences
              </div>
              <Button asChild variant="outline" className="w-full touch-target-44 text-xs sm:text-sm h-9 sm:h-10 min-w-0">
                <Link to="/settings" className="flex items-center justify-center truncate">
                  <span className="hidden sm:inline truncate">Account Settings</span>
                  <span className="sm:hidden truncate">Settings</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & Quick Actions */}
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[140px] sm:min-h-[130px] border-dashed border-muted-foreground/30"
        )}>
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="line-clamp-1">Quick Actions</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              Recent items & shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                Access recently viewed items and quick shortcuts
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1 text-xs h-8">
                  <Link to="/recently-viewed">Recent</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1 text-xs h-8">
                  <Link to="/search">Search</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
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
