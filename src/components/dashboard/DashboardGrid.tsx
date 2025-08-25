
import React from "react";
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
  Zap
} from "lucide-react";
import ProfileDataIntegrityPanel from "@/components/settings/ProfileDataIntegrityPanel";
import QuickGiftCTA from "./QuickGiftCTA";
import { useAuth } from "@/contexts/auth";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { cn } from "@/lib/utils";

const DashboardGrid = () => {
  const { user } = useAuth();
  const { connectionStats } = useActivityFeed(5);
  const { wishlists } = useUnifiedWishlistSystem();
  
  const wishlistCount = wishlists?.length || 0;
  const totalWishlistItems = wishlists?.reduce((total, wishlist) => 
    total + (wishlist.items?.length || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Profile Data Integrity Panel - Top Priority */}
      <ProfileDataIntegrityPanel />

      {/* Quick Gift Setup CTA */}
      <QuickGiftCTA />

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="text-center hover:shadow-sm transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-primary">{connectionStats.accepted}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Friends</div>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:shadow-sm transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-primary">{wishlistCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Wishlists</div>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:shadow-sm transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-primary">{totalWishlistItems}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Items</div>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:shadow-sm transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{connectionStats.pending}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Gifting Hub */}
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[160px] sm:min-h-[140px]"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
              <Gift className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              Gifting Hub
            </CardTitle>
            <CardDescription className="text-sm">
              Manage events, auto-gifting, and group projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Schedule gifts, set up automation, and coordinate group gifts
              </div>
              <Button asChild className="w-full touch-target-44">
                <Link to="/gifting">
                  Open Gifting Hub
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Social Hub */}
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[160px] sm:min-h-[140px]"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
              <Users className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              Social Hub
              {connectionStats.pending > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {connectionStats.pending}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              Connect with friends and manage relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                View activity, manage connections, and send messages
              </div>
              <Button asChild className="w-full touch-target-44">
                <Link to="/social">
                  Open Social Hub
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Nicole AI */}
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[160px] sm:min-h-[140px]"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
              <Brain className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              Nicole AI
            </CardTitle>
            <CardDescription className="text-sm">
              Your AI gift discovery assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Get personalized recommendations and insights
              </div>
              <Button asChild className="w-full touch-target-44">
                <Link to="/nicole">
                  Chat with Nicole
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace */}
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[160px] sm:min-h-[140px]"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
              <ShoppingBag className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              Marketplace
            </CardTitle>
            <CardDescription className="text-sm">
              Discover and shop for gifts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Browse products and find the perfect gifts
              </div>
              <Button asChild variant="outline" className="w-full touch-target-44">
                <Link to="/marketplace">
                  Browse Products
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Wishlists */}
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[160px] sm:min-h-[140px]"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
              <Heart className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              My Wishlists
            </CardTitle>
            <CardDescription className="text-sm">
              Manage your wishlist collections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Create and share wishlists with friends
              </div>
              <Button asChild variant="outline" className="w-full touch-target-44">
                <Link to="/wishlists">
                  View Wishlists
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer group",
          "touch-manipulation min-h-[160px] sm:min-h-[140px]"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
              <Settings className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              Account
            </CardTitle>
            <CardDescription className="text-sm">
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Update profile, privacy, and preferences
              </div>
              <Button asChild variant="outline" className="w-full touch-target-44">
                <Link to="/account">
                  Account Settings
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardGrid;
