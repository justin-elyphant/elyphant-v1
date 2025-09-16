import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, 
  Users, 
  Brain, 
  Settings, 
  Heart, 
  ShoppingBag, 
  Search,
  MessageCircle,
  CreditCard,
  TrendingUp,
  Calendar,
  HelpCircle,
  Plus,
  Zap
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import "../../styles/mobile-scrolling.css";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number;
  primary?: boolean;
}

const MobileDashboardGrid = () => {
  const { user } = useAuth();
  const { connectionStats } = useActivityFeed(5);
  const { wishlists } = useUnifiedWishlistSystem();
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const wishlistCount = wishlists?.length || 0;
  const totalWishlistItems = wishlists?.reduce((total, wishlist) => 
    total + (wishlist.items?.length || 0), 0) || 0;

  // Quick stats for horizontal scrolling bar
  const stats = [
    { label: "Friends", value: connectionStats.accepted, color: "text-primary" },
    { label: "Lists", value: wishlistCount, color: "text-primary" },
    { label: "Items", value: totalWishlistItems, color: "text-primary" },
    { label: "Pending", value: connectionStats.pending, color: "text-orange-600" },
  ];

  // 4x4 Icon Grid - Primary Actions
  const iconGridActions: QuickAction[] = [
    // Row 1 - Core Features
    { id: "shop", label: "Shop", icon: <ShoppingBag className="h-6 w-6" />, href: "/marketplace", primary: true },
    { id: "gift", label: "Quick Gift", icon: <Gift className="h-6 w-6" />, href: "/gifting", primary: true },
    { id: "messages", label: "Messages", icon: <MessageCircle className="h-6 w-6" />, href: "/messages" },
    { id: "nicole", label: "Nicole AI", icon: <Brain className="h-6 w-6" />, href: "/nicole" },
    
    // Row 2 - Social & Personal
    { id: "friends", label: "Friends", icon: <Users className="h-6 w-6" />, href: "/connections", badge: connectionStats.pending },
    { id: "wishlists", label: "Lists", icon: <Heart className="h-6 w-6" />, href: "/wishlists" },
    { id: "settings", label: "Settings", icon: <Settings className="h-6 w-6" />, onClick: () => setShowQuickActions(true) },
    { id: "payments", label: "Payments", icon: <CreditCard className="h-6 w-6" />, href: "/settings?tab=payment" },
    
    // Row 3 - Analytics & Tools
    { id: "analytics", label: "Analytics", icon: <TrendingUp className="h-6 w-6" />, href: "/analytics" },
    { id: "calendar", label: "Calendar", icon: <Calendar className="h-6 w-6" />, href: "/calendar" },
    { id: "help", label: "Help", icon: <HelpCircle className="h-6 w-6" />, href: "/help" },
    { id: "search", label: "Search", icon: <Search className="h-6 w-6" />, href: "/search" },
  ];

  // Recent activity items (horizontal scroll)
  const recentItems = [
    { title: "iPhone 15 Pro", category: "Recently Viewed", image: "📱" },
    { title: "Sarah's Birthday", category: "Upcoming Event", image: "🎂" },
    { title: "Winter Wishlist", category: "Active List", image: "❄️" },
  ];

  const handleSettingsAction = (action: string) => {
    setShowQuickActions(false);
    // Navigate to specific settings based on action
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome Banner */}
      {user && (
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground mb-1">
                Welcome to your hub!
              </h3>
              <p className="text-xs text-muted-foreground">
                Tap any icon below for quick access to features
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Stats Bar */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {stats.map((stat, index) => (
          <Card key={index} className="flex-shrink-0 min-w-[80px] text-center">
            <CardContent className="p-3">
              <div className={cn("text-xl font-bold", stat.color)}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4x4 Icon Grid */}
      <div className="grid grid-cols-4 gap-4">
        {iconGridActions.map((action) => {
          const ActionContent = () => (
            <div className="relative">
              <Button
                variant={action.primary ? "default" : "ghost"}
                size="lg"
                className={cn(
                  "h-20 w-full flex-col gap-2 text-center touch-target-44 mobile-card-hover grid-touch-optimize",
                  action.primary && "bg-primary/10 hover:bg-primary/20 border border-primary/30"
                )}
              >
                <div className="relative">
                  {action.icon}
                  {action.badge && action.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                    >
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium leading-tight">
                  {action.label}
                </span>
              </Button>
            </div>
          );

          if (action.href) {
            return (
              <Link key={action.id} to={action.href}>
                <ActionContent />
              </Link>
            );
          }

          return (
            <div key={action.id} onClick={action.onClick}>
              <ActionContent />
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {recentItems.map((item, index) => (
            <Card key={index} className="flex-shrink-0 w-44">
              <CardContent className="p-3">
                <div className="text-2xl mb-2">{item.image}</div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium truncate">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add more card */}
          <Card className="flex-shrink-0 w-44 border-dashed">
            <CardContent className="p-3 flex items-center justify-center h-full">
              <div className="text-center">
                <Plus className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">View All</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settings Bottom Sheet */}
      <Sheet open={showQuickActions} onOpenChange={setShowQuickActions}>
        <SheetContent side="bottom" className="h-[400px]">
          <SheetHeader>
            <SheetTitle>Account Settings</SheetTitle>
            <SheetDescription>
              Manage your profile, privacy, and preferences
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={() => handleSettingsAction("profile")}
                asChild
              >
                <Link to="/settings?tab=general">
                  <Settings className="h-6 w-6" />
                  <span className="text-xs">Profile</span>
                </Link>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={() => handleSettingsAction("privacy")}
                asChild
              >
                <Link to="/settings?tab=privacy">
                  <Users className="h-6 w-6" />
                  <span className="text-xs">Privacy</span>
                </Link>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={() => handleSettingsAction("notifications")}
                asChild
              >
                <Link to="/settings?tab=notifications">
                  <MessageCircle className="h-6 w-6" />
                  <span className="text-xs">Notifications</span>
                </Link>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={() => handleSettingsAction("payments")}
                asChild
              >
                <Link to="/settings?tab=payment">
                  <CreditCard className="h-6 w-6" />
                  <span className="text-xs">Payments</span>
                </Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg fab-animate"
          onClick={() => setShowQuickActions(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default MobileDashboardGrid;