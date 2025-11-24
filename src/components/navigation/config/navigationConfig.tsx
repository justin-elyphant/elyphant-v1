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
    // Primary Navigation
    {
      id: "primary",
      title: "Navigate",
      items: [
        {
          id: "home",
          label: "Home",
          href: "/",
          icon: <Home className="h-5 w-5" />,
          section: "primary"
        }
      ]
    },

    // Main Features (Authenticated)
    ...(isAuthenticated ? [{
      id: "features",
      title: "Features",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          href: "/dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
          badge: badges.issues > 0 ? badges.issues : undefined,
          section: "secondary" as const,
          requiresAuth: true
        },
        {
          id: "gifting",
          label: "Gifting Hub",
          href: "/dashboard?tab=auto-gifts",
          icon: <Gift className="h-5 w-5" />,
          section: "secondary" as const,
          requiresAuth: true
        },
        /* Temporarily hidden - Nicole AI
        {
          id: "nicole",
          label: "Nicole AI",
          href: "/nicole",
          icon: <Brain className="h-5 w-5" />,
          section: "secondary" as const
        }
        */
      ]
    }] : []),

    // Account Section (Authenticated)
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
          id: "wishlists",
          label: "Wishlists",
          href: "/wishlists",
          icon: <Heart className="h-5 w-5" />,
          section: "account" as const,
          requiresAuth: true
        },
        {
          id: "orders",
          label: "Orders",
          href: "/orders",
          icon: <Package className="h-5 w-5" />,
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

    // Communication (Authenticated)
    ...(isAuthenticated ? [{
      id: "communication",
      title: "Connect",
      items: [
        {
          id: "messages",
          label: "Messages",
          href: "/messages",
          icon: <MessageSquare className="h-5 w-5" />,
          badge: badges.messages > 0 ? badges.messages : undefined,
          section: "account" as const,
          requiresAuth: true
        },
        {
          id: "connections",
          label: "Connections",
          href: "/connections",
          icon: <UserCheck className="h-5 w-5" />,
          badge: badges.connections > 0 ? badges.connections : undefined,
          section: "account" as const,
          requiresAuth: true
        },
        {
          id: "notifications",
          label: "Notifications",
          href: "/notifications",
          icon: <Bell className="h-5 w-5" />,
          badge: badges.notifications > 0 ? badges.notifications : undefined,
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
        ...(isAuthenticated ? [
          {
            id: "recent",
            label: "Recently Viewed",
            href: "/recently-viewed",
            icon: <Clock className="h-5 w-5" />,
            section: "support" as const,
            requiresAuth: true
          }
        ] : [
          {
            id: "featured",
            label: "Featured Deals",
            href: "/featured-deals",
            icon: <Star className="h-5 w-5" />,
            section: "support" as const
          },
          {
            id: "guides",
            label: "Gift Guides",
            href: "/gift-guides",
            icon: <Gift className="h-5 w-5" />,
            section: "support" as const
          }
        ]),
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