import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ShoppingBag, Gift, Heart, MessageSquare } from "lucide-react";
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
              "relative py-2 px-1 text-base font-medium transition-colors",
              "hover:text-foreground",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <span>{link.label}</span>
              {link.badge !== undefined && link.badge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              )}
            </div>
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-destructive" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default DesktopHorizontalNav;
