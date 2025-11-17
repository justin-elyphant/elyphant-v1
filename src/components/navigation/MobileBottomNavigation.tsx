import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { User, Gift, Heart, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/CartContext";
import { usePendingConnectionsCount } from "@/hooks/usePendingConnectionsCount";
import { useNotifications } from "@/contexts/notifications/NotificationsContext";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useProfileDataIntegrity } from "@/hooks/common/useProfileDataIntegrity";
import { triggerHapticFeedback } from "@/utils/haptics";
import { getNavigationConfig } from "./config/navigationConfig";
import { NavigationItem } from "./types/navigationTypes";

// Use NavigationItem from unified types

const MobileBottomNavigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { getItemCount } = useCart();
  const pendingConnectionsCount = usePendingConnectionsCount();
  const { unreadCount: notificationsCount } = useNotifications();
  const unreadMessagesCount = useUnreadMessagesCount();
  const { hasIssues } = useProfileDataIntegrity();

  const handleTabPress = (tab: NavigationItem) => {
    triggerHapticFeedback('selection');
  };

  // Get unified navigation configuration
  const badges = {
    cart: getItemCount(),
    messages: unreadMessagesCount,
    notifications: notificationsCount,
    connections: pendingConnectionsCount,
    issues: hasIssues ? 1 : 0
  };
  
  const { sections } = getNavigationConfig(!!user, badges);
  
  // Extract bottom navigation items from primary section
  const primarySection = sections.find(s => s.id === 'primary');
  const featuresSection = sections.find(s => s.id === 'features');
  
  // Optimized 5-tab structure: Messages, Shop, Gifting, Saved, Account
  const tabs: NavigationItem[] = [
    // Messages tab (replacing Home since logo serves as home navigation)
    ...(user ? [{
      id: 'messages',
      label: 'Messages',
      href: '/messages',
      icon: <MessageSquare className="h-5 w-5" />,
      hasUnread: badges.messages > 0, // Use hasUnread instead of badge count
      section: 'primary' as const
    }] : []),
    
    // Shop tab from primary section
    ...(primarySection?.items || []).slice(1, 2), // Shop only (skip Home)
    
    // Add Gifting as a dedicated tab (Gifting CTA)
    {
      id: 'gifting',
      label: 'Gifting',
      href: '/gifting',
      icon: <Gift className="h-5 w-5" />,
      section: 'primary' as const
    },
    
    // Add Favorites/Saved (Wishlists) - industry standard 4th tab
    ...(user ? [{
      id: 'favorites',
      label: 'Saved',
      href: '/wishlists',
      icon: <Heart className="h-5 w-5" />,
      section: 'primary' as const
    }] : [{
      id: 'favorites',
      label: 'Saved',
      href: '/auth',
      icon: <Heart className="h-5 w-5" />,
      section: 'primary' as const
    }]),
    
    // Account tab - always 5th position (industry standard)
    ...(user ? [{
      id: 'account',
      label: 'Account',
      href: '/dashboard',
      icon: <User className="h-5 w-5" />,
      section: 'account' as const
    }] : [{
      id: 'auth',
      label: 'Sign In',
      href: '/auth',
      icon: <User className="h-5 w-5" />
    }])
  ].filter(Boolean) as NavigationItem[];

  const isTabActive = (tab: NavigationItem): boolean => {
    if (tab.href === "/") {
      return location.pathname === "/";
    }
    // Handle messages consistency  
    if (tab.id === "messages") {
      return location.pathname.startsWith("/messages");
    }
    // Handle route consistency - account should match dashboard, settings and profile
    if (tab.id === "account") {
      return location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/settings") || location.pathname.startsWith("/profile");
    }
    // Handle favorites/saved consistency
    if (tab.id === "favorites") {
      return location.pathname.startsWith("/wishlists") || location.pathname.startsWith("/saved");
    }
    // Handle gifting consistency
    if (tab.id === "gifting") {
      return location.pathname.startsWith("/gifting");
    }
    return location.pathname.startsWith(tab.href);
  };

// Don't show on auth pages, checkout, admin pages, or home page to avoid CTA overlap
if (
  location.pathname === "/auth" ||
  location.pathname === "/reset-password" ||
  location.pathname.startsWith("/checkout") ||
  location.pathname.startsWith("/trunkline") ||
  location.pathname === "/" ||
  location.pathname === "/home"
) {
  return null;
}

  return (
    <nav className="mobile-bottom-nav lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur-lg border-t border-border">
      <div className="safe-area-bottom">
        <div className="flex items-center justify-around px-safe py-1">
          {tabs.map((tab) => {
            const isActive = isTabActive(tab);
            
            return (
              <Link
                key={tab.id}
                to={tab.href}
                onClick={() => handleTabPress(tab)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 min-h-[60px] transition-all duration-200 touch-manipulation relative group flex-1 rounded-lg",
                  // Enhanced active and focus states
                  isActive 
                    ? "text-primary bg-primary/5" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  // Focus and accessibility
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                  // Touch interaction feedback
                  "active:scale-95"
                )}
              >
                {/* Icon with badge */}
                <div className="relative">
                  <div className={cn(
                    "transition-all duration-200 transform relative",
                    isActive 
                      ? "text-primary scale-110 drop-shadow-sm" 
                      : "text-muted-foreground group-hover:text-foreground group-active:scale-95"
                  )}>
                    {tab.icon}
                  </div>
                  
                  {/* Enhanced Badge with better positioning and animation */}
                  {/* Messages use hasUnread property, others use badge */}
                  {((tab.id === "messages" && tab.hasUnread) || (tab.id !== "messages" && tab.badge && tab.badge > 0)) && (
                    <div className={cn(
                      "absolute -top-1 -right-1 shadow-md transition-all duration-200",
                      "animate-pulse",
                      // Messages get a simple red dot indicator
                      tab.id === "messages" 
                        ? "w-2 h-2 bg-destructive rounded-full border border-background" 
                        : tab.id === "cart" 
                          ? "bg-primary text-primary-foreground border border-background text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1" 
                          : "bg-destructive text-destructive-foreground border border-background text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                    )}>
                      {tab.id === "messages" ? "" : (tab.badge > 99 ? "99+" : tab.badge)}
                    </div>
                  )}
                </div>
                
                {/* Enhanced Label with better typography */}
                <span className={cn(
                  "text-xs font-medium mt-1 transition-all duration-200 text-center leading-tight",
                  isActive 
                    ? "text-primary font-semibold" 
                    : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {tab.label}
                </span>
                
                {/* Enhanced Active indicator with glow effect */}
                {isActive && (
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-primary rounded-full shadow-lg animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNavigation;