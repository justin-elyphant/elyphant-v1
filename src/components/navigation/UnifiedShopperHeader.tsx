import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";

// Shopper-specific components
import Logo from "@/components/home/components/Logo";
import AuthButtons from "@/components/home/components/AuthButtons";
import UserButton from "@/components/auth/UserButton";
// Removed MobileBottomNavigation import - will be rendered at app level
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";

// Direct imports to avoid dynamic import issues
import AIEnhancedSearchBar from "@/components/search/AIEnhancedSearchBar";
import OptimizedShoppingCartButton from "@/components/marketplace/components/OptimizedShoppingCartButton";

interface UnifiedShopperHeaderProps {
  mode?: "main" | "minimal" | "marketplace-focused";
  className?: string;
  showSearch?: boolean;
  showCart?: boolean;
}

const UnifiedShopperHeader: React.FC<UnifiedShopperHeaderProps> = ({
  mode = "main",
  className,
  showSearch,
  showCart,
}) => {
  const authContext = useAuth();
  // Remove mobile menu state as we're using bottom navigation
  const location = useLocation();

  // Handle case where AuthProvider context is not yet available
  if (!authContext) {
    return (
      <header className={cn("sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm", className)}>
        <nav className="bg-transparent">
          <div className="container-header">
            <div className="flex items-center justify-between h-16">
              <div className="flex-shrink-0">
                <Logo />
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="h-10 w-20 surface-secondary rounded animate-pulse" />
              </div>
              <div className="md:hidden">
                <div className="h-10 w-10 surface-secondary rounded animate-pulse" />
              </div>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  const { user, signOut } = authContext;

  // Auto-detect features based on route if not explicitly set
  const isAuthPage = ['/auth', '/reset-password'].includes(location.pathname);
  const shouldShowSearch = showSearch ?? !isAuthPage;
  const shouldShowCart = showCart ?? !isAuthPage;

  // Mode-specific configurations
  const modeConfig = {
    main: {
      height: "h-16 md:h-20", // Better mobile touch targets
      searchEnabled: shouldShowSearch,
      cartEnabled: shouldShowCart,
    },
    minimal: {
      height: "h-16 md:h-16", // Consistent height
      searchEnabled: false,
      cartEnabled: false,
    },
    "marketplace-focused": {
      height: "h-16 md:h-20", // Better mobile touch targets
      searchEnabled: true,
      cartEnabled: shouldShowCart,
    },
  };

  const config = modeConfig[mode];

  const marketplaceItems: NavDropdownItem[] = [
    { label: "All Products", href: "/marketplace" },
    { label: "Electronics", href: "/marketplace?category=electronics" },
    { label: "Fashion", href: "/marketplace?category=fashion" },
    { label: "Home & Garden", href: "/marketplace?category=home-garden" },
    { label: "Sports & Outdoors", href: "/marketplace?category=sports" },
    { label: "Books & Media", href: "/marketplace?category=books" },
  ];

  const profileItems: NavDropdownItem[] = [
    { label: "Profile", href: "/profile" },
    { label: "Settings", href: "/settings" },
    { label: "Orders", href: "/orders" },
    { label: "Wishlists", href: "/my-wishlists" },
  ];

  return (
    <header className={cn("sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm", className)}>
      <nav className="bg-transparent">
        <div className="container-header">
          <div className={cn("flex items-center", config.height)}>
            {/* Logo */}
            <div className="flex-shrink-0 w-32 md:w-48">
              <Logo />
            </div>

            {/* Desktop Search Bar */}
            {config.searchEnabled && (
              <div className="hidden md:flex flex-1 mx-6">
                <AIEnhancedSearchBar />
              </div>
            )}

            {/* Desktop Auth & Cart */}
            <div className="hidden md:flex items-center gap-commerce flex-shrink-0">
              {config.cartEnabled && <OptimizedShoppingCartButton />}
              {user ? <UserButton /> : <AuthButtons />}
            </div>

            {/* Mobile Right Side - Clean minimal layout */}
            <div className="md:hidden flex items-center gap-3 ml-auto">
              {user && <UserButton />}
              {config.cartEnabled && <OptimizedShoppingCartButton />}
            </div>
          </div>

          {/* Mobile Search Bar - Clean design */}
          {config.searchEnabled && (
            <div className="md:hidden bg-surface/30 border-t border-border/30 py-2">
              <div className="px-4">
                <AIEnhancedSearchBar mobile />
              </div>
            </div>
          )}
        </div>

        {/* Bottom navigation removed from header - will be rendered at app level */}
      </nav>
    </header>
  );
};

export default UnifiedShopperHeader;