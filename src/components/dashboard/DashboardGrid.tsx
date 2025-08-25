
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{connectionStats.accepted}</div>
            <div className="text-sm text-muted-foreground">Friends</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{wishlistCount}</div>
            <div className="text-sm text-muted-foreground">Wishlists</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{totalWishlistItems}</div>
            <div className="text-sm text-muted-foreground">Wishlist Items</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{connectionStats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gifting Hub */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Gifting Hub
            </CardTitle>
            <CardDescription>
              Manage events, auto-gifting, and group projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Schedule gifts, set up automation, and coordinate group gifts
              </div>
              <Button asChild className="w-full">
                <Link to="/gifting">
                  Open Gifting Hub
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Social Hub */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Social Hub
              {connectionStats.pending > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {connectionStats.pending}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Connect with friends and manage relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                View activity, manage connections, and send messages
              </div>
              <Button asChild className="w-full">
                <Link to="/social">
                  Open Social Hub
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Nicole AI */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Nicole AI
            </CardTitle>
            <CardDescription>
              Your AI gift discovery assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Get personalized recommendations and insights
              </div>
              <Button asChild className="w-full">
                <Link to="/nicole">
                  Chat with Nicole
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Marketplace
            </CardTitle>
            <CardDescription>
              Discover and shop for gifts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Browse products and find the perfect gifts
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to="/marketplace">
                  Browse Products
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Wishlists */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              My Wishlists
            </CardTitle>
            <CardDescription>
              Manage your wishlist collections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Create and share wishlists with friends
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to="/wishlists">
                  View Wishlists
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Account
            </CardTitle>
            <CardDescription>
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Update profile, privacy, and preferences
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to="/account">
                  Account Settings
                  <ArrowRight className="h-4 w-4 ml-2" />
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
