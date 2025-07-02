
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import Logo from "./Logo";
import AuthButtons from "./AuthButtons";
import EnhancedSearchBar from "./EnhancedSearchBar";
import MarketplaceTopNav from "@/components/marketplace/components/MarketplaceTopNav";

const NavigationBar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignUpRequired = () => {
    navigate("/signup");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    closeMobileMenu();
    navigate("/");
  };

  const navigationLinks = [
    { label: "Home", href: "/" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Gifting", href: "/my-wishlists" },
    { label: "Events", href: "/events" },
  ];

  if (isMobile) {
    return (
      <>
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
          <Logo />
          
          <div className="flex items-center gap-2">
            <MarketplaceTopNav onSignUpRequired={handleSignUpRequired} />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="h-10 w-10"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMobileMenu}
                className="h-10 w-10"
              >
                <X size={24} />
              </Button>
            </div>

            <div className="px-4 py-6 space-y-6">
              {/* Search Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Search Products</h3>
                <EnhancedSearchBar onClose={closeMobileMenu} />
              </div>

              {/* Navigation Links */}
              <nav className="space-y-4">
                <h3 className="font-semibold text-gray-900">Navigation</h3>
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block py-2 text-lg hover:text-primary"
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Authentication Section */}
              <div className="space-y-4 pt-4 border-t">
                {user ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Signed in as {user.email}
                    </p>
                    <div className="space-y-2">
                      <Link
                        to="/dashboard"
                        className="block py-2 text-lg hover:text-primary"
                        onClick={closeMobileMenu}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        className="block py-2 text-lg hover:text-primary"
                        onClick={closeMobileMenu}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block py-2 text-lg hover:text-primary"
                        onClick={closeMobileMenu}
                      >
                        Settings
                      </Link>
                      <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="w-full mt-4"
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <Link to="/signup" onClick={closeMobileMenu}>
                        Sign Up
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/signin" onClick={closeMobileMenu}>
                        Sign In
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop Navigation
  return (
    <nav className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo />
          
          <div className="hidden md:flex items-center space-x-8">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-gray-700 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <EnhancedSearchBar />
            </div>
            <MarketplaceTopNav onSignUpRequired={handleSignUpRequired} />
            <div className="hidden md:block">
              <AuthButtons />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
