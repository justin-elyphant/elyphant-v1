import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  
  const tabs: NavigationItem[] = [
    ...(primarySection?.items || []),
    // Add Nicole AI and Account/Auth from features/account sections
    ...(user ? [
      featuresSection?.items.find(i => i.id === 'nicole'),
      { id: 'account', label: 'Account', href: '/settings', icon: primarySection?.items[0]?.icon, section: 'account' as const }
    ].filter(Boolean) as NavigationItem[] : [
      featuresSection?.items.find(i => i.id === 'nicole'),
      { id: 'auth', label: 'Sign In', href: '/auth', icon: primarySection?.items[0]?.icon }
    ].filter(Boolean) as NavigationItem[])
  ];

  const isTabActive = (tab: NavigationItem): boolean => {
    if (tab.href === "/") {
      return location.pathname === "/";
    }
    // Handle route consistency - account should match settings and profile
    if (tab.id === "account") {
      return location.pathname.startsWith("/settings") || location.pathname.startsWith("/profile");
    }
    return location.pathname.startsWith(tab.href);
  };

  // Don't show on auth pages to avoid clutter
  if (location.pathname === "/auth" || location.pathname === "/reset-password") {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur-lg border-t border-border">
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
                  "flex flex-col items-center justify-center py-2 px-1 min-h-[60px] transition-all duration-200 touch-manipulation",
                  "touch-target-44 relative group flex-1"
                )}
              >
                {/* Icon with badge */}
                <div className="relative">
                  <div className={cn(
                    "transition-all duration-200 transform",
                    isActive 
                      ? "text-primary scale-110" 
                      : "text-muted-foreground group-active:scale-95"
                  )}>
                    {tab.icon}
                  </div>
                  
                  {/* Badge for cart or notifications */}
                  {tab.badge && tab.badge > 0 && (
                    <div className={cn(
                      "absolute -top-2 -right-2 text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1",
                      tab.id === "cart" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-destructive text-destructive-foreground"
                    )}>
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </div>
                  )}
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-xs font-medium mt-1 transition-colors duration-200",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}>
                  {tab.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
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