import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { User, Gift, Heart, MessageSquare, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { triggerHapticFeedback } from "@/utils/haptics";

interface TabItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const MobileBottomNavigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const unreadMessagesCount = useUnreadMessagesCount();

  // iOS-style 5-tab structure: Shop | Auto-Gifts | Wishlists | Messages | Account
  const tabs: TabItem[] = [
    {
      id: 'shop',
      label: 'Shop',
      href: '/marketplace',
      icon: <ShoppingBag className="h-5 w-5" />
    },
    {
      id: 'auto-gifts',
      label: 'AI Gifting',
      href: '/ai-gifting',
      icon: <Gift className="h-5 w-5" />
    },
    {
      id: 'wishlists',
      label: 'Wishlists',
      href: '/wishlists',
      icon: <Heart className="h-5 w-5" />
    },
    {
      id: 'messages',
      label: 'Messages',
      href: '/messages',
      icon: <MessageSquare className="h-5 w-5" />,
      badge: unreadMessagesCount
    },
    {
      id: 'account',
      label: 'Account',
      href: '/dashboard',
      icon: <User className="h-5 w-5" />
    }
  ];

  const isTabActive = (tab: TabItem): boolean => {
    // Shop
    if (tab.id === "shop") {
      return location.pathname.startsWith("/marketplace");
    }
    // Auto-Gifts
    if (tab.id === "auto-gifts") {
      return location.pathname.startsWith("/ai-gifting");
    }
    // Wishlists
    if (tab.id === "wishlists") {
      return location.pathname.startsWith("/wishlists");
    }
    // Messages
    if (tab.id === "messages") {
      return location.pathname.startsWith("/messages");
    }
    // Account
    if (tab.id === "account") {
      return location.pathname.startsWith("/dashboard") || 
             location.pathname.startsWith("/settings") || 
             location.pathname.startsWith("/profile");
    }
    return location.pathname.startsWith(tab.href);
  };

  // Don't show on auth pages, checkout, or admin pages
  if (
    location.pathname === "/auth" ||
    location.pathname === "/reset-password" ||
    location.pathname.startsWith("/checkout") ||
    location.pathname.startsWith("/trunkline")
  ) {
    return null;
  }

  // Don't show if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[60]">
      {/* iOS-style rounded container with backdrop blur */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-border rounded-t-3xl shadow-floating">
        <div className="flex items-center justify-around h-14 px-2 pb-[env(safe-area-inset-bottom)]">
          {tabs.map((tab) => {
            const isActive = isTabActive(tab);
            
            return (
              <Link
                key={tab.id}
                to={tab.href}
                onClick={() => triggerHapticFeedback('selection')}
                className={cn(
                  "flex flex-col items-center justify-center h-full flex-1 rounded-xl transition-all px-2",
                  isActive ? "bg-gradient-to-r from-purple-600 to-sky-500 text-white" : "text-muted-foreground",
                  "active:scale-95" // Spring animation
                )}
              >
                {/* Icon with badge */}
                <div className="relative">
                  {React.cloneElement(tab.icon as React.ReactElement, {
                    className: cn(
                      "h-5 w-5",
                      isActive ? "text-white" : "text-muted-foreground"
                    )
                  })}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-md">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span className="text-xs font-medium mt-1 whitespace-nowrap">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNavigation;