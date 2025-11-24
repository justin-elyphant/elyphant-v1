
import { ShoppingBag, Gift, Users } from "lucide-react";
import React from "react";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";

export const getDefaultLinks = () => [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Auto-Gifts", href: "/dashboard?tab=auto-gifts" },
  { label: "Social Hub", href: "/social" },
  { label: "Nicole AI", href: "/nicole" },
  { label: "Account Settings", href: "/settings" }
];

export const getMarketplaceItems = (): NavDropdownItem[] => [
  { 
    label: "All Products", 
    href: "/marketplace", 
    icon: React.createElement(ShoppingBag, { className: "h-4 w-4" }) 
  },
  { 
    label: "Categories", 
    href: "/marketplace/categories", 
    icon: React.createElement(Gift, { className: "h-4 w-4" }) 
  },
  { label: "Trending", href: "/marketplace/trending" }
];

export const getConnectionsItems = (): NavDropdownItem[] => [
  { 
    label: "My Friends", 
    href: "/connections/friends", 
    icon: React.createElement(Users, { className: "h-4 w-4" }) 
  },
  { 
    label: "Find Friends", 
    href: "/connections/find", 
    icon: React.createElement(Users, { className: "h-4 w-4" }) 
  },
  { label: "Invitations", href: "/connections/invitations" }
];
