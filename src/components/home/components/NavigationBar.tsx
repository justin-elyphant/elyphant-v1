
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import Logo from "./Logo";
import AuthButtons from "./AuthButtons";
import UserButton from "@/components/auth/UserButton";
import CleanMobileNavMenu from "@/components/navigation/components/CleanMobileNavMenu";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";

// Import directly instead of lazy loading to avoid context issues
import AIEnhancedSearchBar from "@/components/search/AIEnhancedSearchBar";
import OptimizedShoppingCartButton from "@/components/marketplace/components/OptimizedShoppingCartButton";

const NavigationBar = () => {
  const authContext = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Handle case where AuthProvider context is not yet available
  if (!authContext) {
    return (
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
    );
  }

  const { user, signOut } = authContext;

  // Don't load heavy components on auth pages for better performance
  const isAuthPage = ['/auth', '/reset-password'].includes(location.pathname);
  const shouldShowSearch = !isAuthPage;
  const shouldShowCart = !isAuthPage;

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
    <nav className="bg-transparent">
      <div className="container-header">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Search Bar */}
          {shouldShowSearch && (
            <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-8">
              <AIEnhancedSearchBar />
            </div>
          )}

          {/* Desktop Auth & Cart */}
          <div className="hidden md:flex items-center gap-commerce">
            {shouldShowCart && <OptimizedShoppingCartButton />}
            {user ? <UserButton /> : <AuthButtons />}
          </div>

          {/* Mobile Right Side - Only Cart and Menu */}
          <div className="md:hidden flex items-center gap-tight">
            {shouldShowCart && <OptimizedShoppingCartButton />}
            <Button
              variant="ghost"
              size="touch"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="touch-target-44"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar - Below header */}
        {shouldShowSearch && (
          <div className="md:hidden touch-padding-sm pt-2">
            <AIEnhancedSearchBar mobile />
          </div>
        )}
      </div>

      {/* Clean Mobile Menu */}
      <CleanMobileNavMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onSignOut={signOut}
        isAuthenticated={!!user}
        marketplaceItems={marketplaceItems}
        profileItems={profileItems}
      />
    </nav>
  );
};

export default NavigationBar;
