import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { 
  Home, 
  ShoppingCart, 
  Heart, 
  Calendar, 
  Users, 
  Settings, 
  Gift,
  Search,
  User,
  Bell
} from "lucide-react";

const ECommerceNavigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const primaryNavItems = [
    { 
      icon: Home, 
      label: "Home", 
      href: "/", 
      exact: true 
    },
    { 
      icon: Search, 
      label: "Marketplace", 
      href: "/marketplace", 
      badge: "Shop" 
    },
    { 
      icon: Heart, 
      label: "Wishlists", 
      href: "/wishlists" 
    },
    { 
      icon: Calendar, 
      label: "Events", 
      href: "/events" 
    }
  ];

  const secondaryNavItems = [
    { 
      icon: Users, 
      label: "Connections", 
      href: "/connections" 
    },
    { 
      icon: ShoppingCart, 
      label: "Orders", 
      href: "/orders" 
    },
    { 
      icon: Settings, 
      label: "Settings", 
      href: "/settings" 
    }
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            
            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "flex flex-col items-center justify-center h-12 gap-1",
                  active && "text-primary bg-primary/10"
                )}
              >
                <Link to={item.href}>
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs px-1">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Elyphant</span>
          </Link>

          {/* Primary Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={active ? "default" : "ghost"}
                  size="sm"
                  className="relative"
                >
                  <Link to={item.href} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </Button>
              );
            })}
          </div>

          {/* Secondary Navigation */}
          <div className="flex items-center space-x-2">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={active ? "default" : "ghost"}
                  size="sm"
                >
                  <Link to={item.href}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline ml-1">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ECommerceNavigation;