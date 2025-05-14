
import { ShoppingBag, Gift, Users } from "lucide-react";
import React from "react";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";

export const getDefaultLinks = () => [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Connections", href: "/connections" },
  { label: "Profile", href: "/profile-setup" },
  { label: "Wishlists", href: "/wishlists" }
];

export const getMarketplaceItems = (): NavDropdownItem[] => [
  { label: "All Products", href: "/marketplace", icon: <ShoppingBag className="h-4 w-4" /> },
  { label: "Categories", href: "/marketplace/categories", icon: <Gift className="h-4 w-4" /> },
  { label: "Trending", href: "/marketplace/trending" }
];

export const getConnectionsItems = (): NavDropdownItem[] => [
  { label: "My Friends", href: "/connections/friends", icon: <Users className="h-4 w-4" /> },
  { label: "Find Friends", href: "/connections/find", icon: <Users className="h-4 w-4" /> },
  { label: "Invitations", href: "/connections/invitations" }
];
