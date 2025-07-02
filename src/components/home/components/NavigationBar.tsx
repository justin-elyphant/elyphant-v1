
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import Logo from "./Logo";
import UnifiedSearchBar from "@/components/search/UnifiedSearchBar";
import MobileMenu from "@/components/layout/navigation/MobileMenu";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";

const NavigationBar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  // Navigation links for main menu
  const links = [
    { label: "Home", href: "/" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "My Wishlists", href: "/my-wishlists" },
  ];

  // Marketplace dropdown items
  const marketplaceItems: NavDropdownItem[] = [
    { label: "Browse All", href: "/marketplace" },
    { label: "Categories", href: "/marketplace?category=all" },
    { label: "Brands", href: "/marketplace?brands=popular" },
  ];

  // Connections dropdown items (for logged in users)
  const connectionsItems: NavDropdownItem[] = [
    { label: "Friends", href: "/connections?tab=friends" },
    { label: "Following", href: "/connections?tab=following" },
    { label: "Suggestions", href: "/connections?tab=suggestions" },
  ];

  return (
    <>
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Desktop Search Bar */}
          {!isMobile && (
            <div className="flex-1 max-w-2xl mx-8">
              <UnifiedSearchBar />
            </div>
          )}

          {/* Desktop Navigation & Auth */}
          {!isMobile && (
            <div className="flex items-center space-x-4">
              {/* Navigation Links */}
              <div className="flex items-center space-x-6">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive(link.href)
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Shopping Cart */}
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="h-4 w-4" />
              </Button>

              {/* Auth Buttons */}
              {!user ? (
                <div className="flex items-center space-x-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/login">Log In</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={signOut}>
                  Log Out
                </Button>
              )}
            </div>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <div className="flex items-center space-x-3">
              {/* Shopping Cart */}
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="h-4 w-4" />
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="touch-manipulation"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Search Bar */}
        {isMobile && (
          <div className="mt-4">
            <UnifiedSearchBar mobile={true} />
          </div>
        )}
      </nav>

      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <MobileMenu
          links={links}
          marketplaceItems={marketplaceItems}
          connectionsItems={connectionsItems}
          isActive={isActive}
          onClose={() => setMobileMenuOpen(false)}
          signOut={signOut}
        />
      )}
    </>
  );
};

export default NavigationBar;
