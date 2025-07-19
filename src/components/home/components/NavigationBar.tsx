
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

// Lazy load heavy components to improve performance on auth pages
const AIEnhancedSearchBar = React.lazy(() => import("@/components/search/AIEnhancedSearchBar"));
const OptimizedShoppingCartButton = React.lazy(() => import("@/components/marketplace/components/OptimizedShoppingCartButton"));

const NavigationBar = () => {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Don't load heavy components on auth pages for better performance
  const isAuthPage = ['/signin', '/signup', '/reset-password'].includes(location.pathname);
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
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Search Bar */}
          {shouldShowSearch && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <React.Suspense fallback={<div className="h-10 bg-muted rounded animate-pulse flex-1" />}>
                <AIEnhancedSearchBar />
              </React.Suspense>
            </div>
          )}

          {/* Desktop Auth & Cart */}
          <div className="hidden md:flex items-center space-x-4">
            {shouldShowCart && (
              <React.Suspense fallback={<div className="h-10 w-10 bg-muted rounded animate-pulse" />}>
                <OptimizedShoppingCartButton />
              </React.Suspense>
            )}
            {user ? <UserButton /> : <AuthButtons />}
          </div>

          {/* Mobile Right Side - Only Cart and Menu */}
          <div className="md:hidden flex items-center space-x-3">
            {shouldShowCart && (
              <React.Suspense fallback={<div className="h-10 w-10 bg-muted rounded animate-pulse" />}>
                <OptimizedShoppingCartButton />
              </React.Suspense>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
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
          <div className="md:hidden pb-3 pt-2">
            <React.Suspense fallback={<div className="h-10 bg-muted rounded animate-pulse mx-4" />}>
              <AIEnhancedSearchBar mobile />
            </React.Suspense>
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
