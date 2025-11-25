import React from "react";
import { 
  Home,
  ShoppingBag, 
  ShoppingCart,
  Heart,
  Package,
  User,
  Settings,
  Users,
  Bell,
  MessageSquare,
  Gift,
  Brain,
  LayoutDashboard,
  CreditCard,
  HelpCircle,
  LogOut,
  Search,
  Star,
  Clock,
  Zap,
  Compass,
  UserCheck,
  Sparkles
} from "lucide-react";
import { NavigationConfig, NavigationItem, NavigationSection } from "../types/navigationTypes";

export const getNavigationConfig = (isAuthenticated: boolean, badges: {
  cart: number;
  messages: number;
  notifications: number;
  connections: number;
  issues: number;
}): NavigationConfig => {
  const quickActions: NavigationItem[] = [
    {
      id: "search",
      label: "Search",
      href: "/search",
      icon: <Search className="h-5 w-5" />,
    },
    ...(isAuthenticated ? [
      {
        id: "wishlist",
        label: "Wishlist",
        href: "/wishlists",
        icon: <Heart className="h-5 w-5" />,
      }
    ] : []),
    {
      id: "gift-ideas",
      label: "Gift Ideas",
      href: "/gift-ideas",
      icon: <Sparkles className="h-5 w-5" />,
    },
    ...(isAuthenticated ? [
      {
        id: "orders",
        label: "Orders",
        href: "/orders",
        icon: <Package className="h-5 w-5" />,
      }
    ] : [])
  ];

  const sections: NavigationSection[] = [
    // Account Section (Authenticated) - Simplified for dropdown
    ...(isAuthenticated ? [{
      id: "account",
      title: "My Account",
      icon: <User className="h-4 w-4" />,
      items: [
        {
          id: "profile",
          label: "My Profile",
          href: "/profile",
          icon: <User className="h-5 w-5" />,
          section: "account" as const,
          requiresAuth: true
        },
        {
          id: "settings",
          label: "Account Settings",
          href: "/settings",
          icon: <Settings className="h-5 w-5" />,
          section: "account" as const,
          requiresAuth: true
        },
        {
          id: "payments",
          label: "Payment Methods",
          href: "/payments",
          icon: <CreditCard className="h-5 w-5" />,
          section: "account" as const,
          requiresAuth: true
        }
      ]
    }] : []),

    // Support Section
    {
      id: "support",
      title: "Support",
      items: [
        {
          id: "help",
          label: "Help & Support",
          href: "/support",
          icon: <HelpCircle className="h-5 w-5" />,
          section: "support" as const
        }
      ]
    }
  ];

  return { sections, quickActions };
};