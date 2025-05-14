
import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, ShoppingBag, Gift, User, Settings, Users } from "lucide-react";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { toast } from "sonner";

export const useNavigationState = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
      navigate("/");
      toast.success("You have been signed out");
    }
  };

  // Define dropdown menus
  const marketplaceItems: NavDropdownItem[] = useMemo(() => [
    { 
      label: "All Products", 
      href: "/marketplace", 
      icon: <ShoppingBag className="h-4 w-4" /> 
    },
    { 
      label: "Categories", 
      href: "/marketplace/categories", 
      icon: <Gift className="h-4 w-4" /> 
    },
    { label: "Trending", href: "/marketplace/trending" },
    { label: "Deals", href: "/marketplace/deals" }
  ], []);
  
  const profileItems: NavDropdownItem[] = useMemo(() => user ? [
    { 
      label: "Dashboard", 
      href: "/dashboard", 
      icon: <Home className="h-4 w-4" /> 
    },
    { 
      label: "Profile", 
      href: "/profile", 
      icon: <User className="h-4 w-4" /> 
    },
    { 
      label: "Wishlists", 
      href: "/wishlists", 
      icon: <Gift className="h-4 w-4" /> 
    },
    { 
      label: "Connections", 
      href: "/connections", 
      icon: <Users className="h-4 w-4" /> 
    },
    { 
      label: "Settings", 
      href: "/settings", 
      icon: <Settings className="h-4 w-4" /> 
    }
  ] : [], [user]);

  return {
    user,
    profile,
    mobileMenuOpen,
    marketplaceItems,
    profileItems,
    toggleMobileMenu,
    handleSignOut
  };
};
