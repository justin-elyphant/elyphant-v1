import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ShoppingBag, Gift, Heart, MessageSquare, User } from "lucide-react";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";

const DesktopHorizontalNav: React.FC = () => {
  const location = useLocation();
  const unreadMessagesCount = useUnreadMessagesCount();

  const navigationLinks = [
    { 
      label: "Shop", 
      href: "/marketplace", 
      icon: ShoppingBag,
      match: (path: string) => path.startsWith("/marketplace")
    },
    { 
      label: "Auto-Gifts", 
      href: "/dashboard?tab=auto-gifts", 
      icon: Gift,
      match: (path: string) => path.startsWith("/dashboard") && location.search.includes("tab=auto-gifts")
    },
    { 
      label: "Wishlists", 
      href: "/wishlists", 
      icon: Heart,
      match: (path: string) => path.startsWith("/wishlists")
    },
    { 
      label: "Messages", 
      href: "/messages", 
      icon: MessageSquare,
      badge: unreadMessagesCount,
      match: (path: string) => path.startsWith("/messages")
    },
    { 
      label: "Account", 
      href: "/dashboard", 
      icon: User,
      match: (path: string) => path.startsWith("/dashboard") || path.startsWith("/settings") || path.startsWith("/profile")
    }
  ];

  return (
    <nav className="hidden md:flex items-center gap-8">
      {navigationLinks.map(link => {
        const isActive = link.match(location.pathname);
        const Icon = link.icon;
        
        return (
          <Link
            key={link.href}
            to={link.href}
            className={cn(
              "relative py-2 px-4 min-h-[44px] text-base font-medium rounded-lg transition-all",
              "flex items-center gap-2",
              isActive 
                ? "bg-elyphant-gradient text-white" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <span>{link.label}</span>
            {link.badge !== undefined && link.badge > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-md">
                {link.badge > 99 ? '99+' : link.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default DesktopHorizontalNav;
